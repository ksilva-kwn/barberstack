# Barberstack — Setup Manual (AWS)

Execute estes passos **uma vez**, na ordem abaixo.
Tudo usa o mesmo usuário IAM `barberstack-ci`.

---

## PASSO 1 — Criar usuário IAM no Console AWS

1. Acessa [console.aws.amazon.com/iam](https://console.aws.amazon.com/iam)
2. **Users → Create user**
3. **User name:** `barberstack-ci`
4. **Provide user access to the AWS Management Console** → desmarca (só acesso programático)
5. Em **Permissions** → seleciona **"Attach policies directly"** → **não anexa nada agora**
6. Clica **Next → Create user**

---

## PASSO 2 — Criar a policy e anexar ao usuário

Precisa de um perfil admin para criar a policy. Usa tuas credenciais de admin/root temporariamente:

```bash
aws configure --profile bootstrap
# Cole as credenciais da sua conta admin/root
# Region: us-east-1 / Output: json

# Pega o Account ID
ACCOUNT_ID=$(aws sts get-caller-identity \
  --query Account --output text --profile bootstrap)

# Cria a policy a partir do arquivo do repositório
aws iam create-policy \
  --policy-name barberstack-ci-policy \
  --policy-document file://infrastructure/iam-policy.json \
  --profile bootstrap

# Anexa ao usuário
aws iam attach-user-policy \
  --user-name barberstack-ci \
  --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/barberstack-ci-policy" \
  --profile bootstrap
```

---

## PASSO 3 — Gerar credenciais do barberstack-ci

```bash
aws iam create-access-key \
  --user-name barberstack-ci \
  --profile bootstrap
```

Output:
```json
{
  "AccessKey": {
    "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  }
}
```

**Anota os dois valores** → serão os GitHub Secrets `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`.

Configura o profile:
```bash
aws configure --profile barberstack-ci
# Access Key ID:     (AccessKeyId acima)
# Secret Access Key: (SecretAccessKey acima)
# Region:            us-east-1
# Output:            json

# Confirma
aws sts get-caller-identity --profile barberstack-ci
```

---

## PASSO 4 — Importar chave SSH no Console EC2

1. Acessa [console.aws.amazon.com/ec2](https://console.aws.amazon.com/ec2)
2. Menu esquerdo → **Network & Security → Key Pairs**
3. **Actions → Import key pair**
4. **Name:** `barberstack-key`
5. Em **Public key contents**, cola o conteúdo da tua chave pública:
```bash
cat ~/.ssh/id_rsa.pub
# ou
cat ~/.ssh/id_ed25519.pub
```
6. Clica **Import key pair**

O GitHub Secret `EC2_SSH_KEY` recebe a chave **privada**:
```bash
cat ~/.ssh/id_rsa
# ou
cat ~/.ssh/id_ed25519
```

---

## PASSO 5 — Criar tabela DynamoDB no Console

1. Acessa [console.aws.amazon.com/dynamodb](https://console.aws.amazon.com/dynamodb)
2. **Create table**
3. **Table name:** `barberstack-terraform-locks`
4. **Partition key:** `LockID` (tipo `String`)
5. **Table settings:** seleciona **Customize settings**
6. **Capacity mode:** `On-demand`
7. Clica **Create table**

---

## PASSO 6 — Repositório GitHub e Secrets

**Cria o repositório:**
1. Acessa [github.com/new](https://github.com/new)
2. Nome: `barberstack` → **Private** → sem README → **Create repository**

**Configura os secrets** em: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor | Origem |
|--------|-------|--------|
| `AWS_ACCESS_KEY_ID` | AccessKeyId do Passo 3 | IAM |
| `AWS_SECRET_ACCESS_KEY` | SecretAccessKey do Passo 3 | IAM |
| `AWS_REGION` | `us-east-1` | fixo |
| `EC2_SSH_KEY` | Conteúdo da chave privada (`~/.ssh/id_rsa`) | Passo 4 |

> São apenas **4 secrets**. O bucket S3 e a tabela DynamoDB são criados automaticamente
> pela pipeline usando o Account ID da AWS como sufixo — nenhuma configuração manual necessária.

**Cria o environment de produção** (aprovação antes do apply):

**Settings → Environments → New environment → nome:** `production`

---

## PASSO 7 — Push inicial

```bash
cd c:/Users/kwnsi/Downloads/barberstack

git remote add origin https://github.com/SEU-USUARIO/barberstack.git
git branch -M main
git add .
git commit -m "feat: initial barberstack scaffold"
git push -u origin main
```

A pipeline **Infrastructure — Terraform** dispara. Acompanha em **GitHub → Actions**.

O que acontece automaticamente:
1. Pipeline cria o **S3 bucket** (idempotente)
2. `terraform apply` cria: VPC, RDS, EC2, Amplify, SSM parameters
3. SSM parameters são criados com:
   - `DB_PASSWORD` → senha aleatória de 24 chars
   - `JWT_SECRET` → hex de 64 chars
   - `ASAAS_MASTER_API_KEY` → **placeholder** (você atualiza depois)
   - `GITHUB_TOKEN` → **placeholder** (você atualiza depois)

---

## PASSO 8 — Atualizar os 2 placeholders no SSM Console

Após o `terraform apply` terminar, atualiza os dois parâmetros que precisam de valores reais:

1. Acessa [console.aws.amazon.com/systems-manager/parameters](https://console.aws.amazon.com/systems-manager/parameters)
2. Filtra por `/barberstack/production`

**ASAAS_MASTER_API_KEY:**
- Clica em `/barberstack/production/ASAAS_MASTER_API_KEY` → **Edit**
- Cola a chave do painel Asaas → **Save changes**
- *(Asaas: Configurações → Integrações → API → Gerar chave)*

**GITHUB_TOKEN:**
- Clica em `/barberstack/production/GITHUB_TOKEN` → **Edit**
- Cola o token do GitHub → **Save changes**
- *(GitHub: Settings → Developer settings → Personal access tokens → Tokens classic → scope: `repo`)*

---

## PASSO 9 — Adicionar EC2_HOST e reiniciar o Amplify

Quando a pipeline terminar, pega o IP do EC2 nos **outputs** do job:

**GitHub → Actions → último run → Terraform Apply → Show outputs**

```
ec2_public_ip = "54.123.45.67"
amplify_url   = "https://main.xxxxx.amplifyapp.com"
```

Adiciona o último secret:

**GitHub → Settings → Secrets → New secret**

| Secret | Valor |
|--------|-------|
| `EC2_HOST` | IP do output |

Agora re-executa a pipeline do Amplify para pegar o GITHUB_TOKEN real:

**GitHub → Actions → Infrastructure — Terraform → Run workflow**

---

## PASSO 10 — Migrations no EC2

```bash
ssh -i ~/.ssh/id_rsa ubuntu@IP_DO_EC2

# Confirma que .env foi gerado do SSM
cat /opt/barberstack/.env

# Clona o repositório
cd /opt/barberstack
git clone https://github.com/SEU-USUARIO/barberstack.git .

# Instala dependências e roda migrations
npm install -g pnpm
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate
pnpm db:seed   # opcional — dados de demonstração

exit
```

---

## PASSO 11 — Deploy dos microserviços

```bash
git commit --allow-empty -m "ci: trigger all service deploys"
git push
```

Ou manualmente: **GitHub → Actions → Service — \<nome\> → Run workflow**

---

## PASSO 12 — Verificar

```bash
# API Gateway
curl http://IP_DO_EC2:3000/health

# Login de demonstração
curl -X POST http://IP_DO_EC2:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dono@barbearia.com","password":"demo123"}'
```

---

## Resumo

```
P1   Console IAM → cria usuário barberstack-ci
P2   CLI         → cria policy + anexa ao usuário
P3   CLI         → gera access key → configura profile
P4   Console EC2 → importa chave pública SSH
P5   Console DDB → cria tabela barberstack-terraform-locks
P6   GitHub      → cria repo + 4 secrets + environment production
P7   git push    → pipeline deriva nomes do Account ID AWS
               → cria S3 + DynamoDB + toda infra (~10 min)
               → SSM criado automaticamente com senhas geradas
P8   Console SSM → atualiza ASAAS_MASTER_API_KEY e GITHUB_TOKEN
P9   GitHub      → adiciona EC2_HOST → re-executa pipeline
P10  SSH EC2     → migrations
P11  git push    → deploy dos 7 microserviços
P12  curl        → verifica health + login
```

## Atualizar um secret no futuro

Acessa [console.aws.amazon.com/systems-manager/parameters](https://console.aws.amazon.com/systems-manager/parameters), filtra por `/barberstack/production`, clica no parâmetro → **Edit → Save changes**.

O EC2 renova o `.env` automaticamente a cada 24h via systemd timer.
Para forçar renovação imediata:
```bash
ssh -i ~/.ssh/id_rsa ubuntu@IP_DO_EC2
sudo systemctl start barberstack-refresh-env.service
```
