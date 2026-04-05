#!/bin/bash
set -euo pipefail
exec > >(tee /var/log/barberstack-userdata.log | logger -t userdata) 2>&1

echo "=== Barberstack EC2 Setup — $(date) ==="

# ─── Dependências do sistema ─────────────────────────────────────────────────
apt-get update -y
apt-get install -y \
  curl git unzip \
  docker.io docker-compose-v2 \
  awscli jq

systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

# ─── Node.js 20 ──────────────────────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm

# ─── Diretório da aplicação ───────────────────────────────────────────────────
APP_DIR="/opt/barberstack"
mkdir -p "$APP_DIR"
chown ubuntu:ubuntu "$APP_DIR"

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
  chown ubuntu:ubuntu "$env_file"
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
User=ubuntu
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

echo "=== Setup concluído — ${project}/${environment} ==="
