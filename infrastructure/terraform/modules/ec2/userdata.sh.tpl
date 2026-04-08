#!/bin/bash
set -euo pipefail
exec > >(tee /var/log/barberstack-userdata.log | logger -t userdata) 2>&1

echo "=== Barberstack EC2 Setup — $(date) ==="

# ─── Dependências do sistema ─────────────────────────────────────────────────
dnf update -y
dnf install -y curl git unzip jq

# ─── Docker ──────────────────────────────────────────────────────────────────
dnf install -y docker
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Docker Compose plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-aarch64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# ─── Node.js 20 ──────────────────────────────────────────────────────────────
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs
npm install -g pnpm

# ─── Diretório da aplicação ───────────────────────────────────────────────────
APP_DIR="/opt/barberstack"
mkdir -p "$APP_DIR"
chown ec2-user:ec2-user "$APP_DIR"

# ─── Função: busca todos os parâmetros do SSM e gera o .env ──────────────────
generate_env_file() {
  local env_file="$APP_DIR/.env"
  echo "# Gerado automaticamente pelo SSM — $(date)" > "$env_file"
  echo "# NÃO edite manualmente." >> "$env_file"
  echo "" >> "$env_file"

  aws ssm get-parameters-by-path \
    --region "${aws_region}" \
    --path "${ssm_path_prefix}" \
    --with-decryption \
    --query "Parameters[*].{Name:Name,Value:Value}" \
    --output json \
  | jq -r '.[] | (.Name | split("/") | last) + "=" + .Value' \
  >> "$env_file"

  chmod 600 "$env_file"
  chown ec2-user:ec2-user "$env_file"
  echo "[SSM] .env gerado com $(grep -c '=' "$env_file") variáveis"
}

generate_env_file

# ─── Cria um serviço systemd para renovar .env e reiniciar containers ─────────
cat > /etc/systemd/system/barberstack-refresh-env.service << 'SYSTEMD'
[Unit]
Description=Barberstack — Refresh env from SSM
After=network-online.target

[Service]
Type=oneshot
User=ec2-user
WorkingDirectory=/opt/barberstack
ExecStart=/usr/local/bin/barberstack-refresh-env.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
SYSTEMD

cat > /usr/local/bin/barberstack-refresh-env.sh << REFRESH
#!/bin/bash
set -e
aws ssm get-parameters-by-path \
  --region "${aws_region}" \
  --path "${ssm_path_prefix}" \
  --with-decryption \
  --query "Parameters[*].{Name:Name,Value:Value}" \
  --output json \
| jq -r '.[] | (.Name | split("/") | last) + "=" + .Value' \
> /opt/barberstack/.env
chmod 600 /opt/barberstack/.env
if [ -f /opt/barberstack/docker-compose.yml ]; then
  docker compose -f /opt/barberstack/docker-compose.yml up -d --remove-orphans
fi
REFRESH

chmod +x /usr/local/bin/barberstack-refresh-env.sh
systemctl enable barberstack-refresh-env.service

# ─── Timer para renovar secrets diariamente ───────────────────────────────────
cat > /etc/systemd/system/barberstack-refresh-env.timer << 'TIMER'
[Unit]
Description=Renovar env do SSM diariamente

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
TIMER

systemctl daemon-reload
systemctl enable barberstack-refresh-env.timer
systemctl start barberstack-refresh-env.timer

# ─── Nginx (proxy 80 → api-gateway :3000) ────────────────────────────────────
dnf install -y nginx

cat > /etc/nginx/conf.d/barberstack.conf << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
NGINX

# Remove default config
rm -f /etc/nginx/conf.d/default.conf

systemctl enable nginx
systemctl start nginx

echo "=== Setup concluído — ${project}/${environment} ==="
