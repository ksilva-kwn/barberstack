# Barberstack — Setup Manual (AWS)

Execute estes comandos **uma vez** antes de fazer o primeiro push.
Tudo usa o profile `barberstack-bootstrap` que você configurou com `AdministratorAccess`.

---

## 1. S3 Bucket — Terraform State

```bash
# Escolha um nome único (adicione suas iniciais ou data)
BUCKET_NAME="barberstack-tfstate-$(date +%Y%m)"
REGION="us-east-1"

aws s3api create-bucket \
  --bucket "$BUCKET_NAME" \
  --region "$REGION" \
  --profile barberstack-bootstrap

aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled \
  --profile barberstack-bootstrap

aws s3api put-bucket-encryption \
  --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' \
  --profile barberstack-bootstrap

aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --profile barberstack-bootstrap

echo "Bucket criado: $BUCKET_NAME"
# Anota esse valor → GitHub Secret: TF_BACKEND_BUCKET
```

---

## 2. DynamoDB — Terraform State Lock

```bash
aws dynamodb create-table \
  --table-name barberstack-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --profile barberstack-bootstrap

# GitHub Secret: TF_BACKEND_DYNAMODB_TABLE = barberstack-terraform-locks
```

---

## 3. IAM User para o GitHub Actions (CI/CD)

```bash
aws iam create-user \
  --user-name barberstack-github-actions \
  --profile barberstack-bootstrap

# Cria as credenciais
aws iam create-access-key \
  --user-name barberstack-github-actions \
  --profile barberstack-bootstrap
# → Anota AccessKeyId e SecretAccessKey
# GitHub Secrets: AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY
```

Agora anexa as permissões necessárias:

```bash
aws iam put-user-policy \
  --user-name barberstack-github-actions \
  --policy-name barberstack-ci-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["s3:GetObject","s3:PutObject","s3:DeleteObject","s3:ListBucket"],
        "Resource": ["arn:aws:s3:::'"$BUCKET_NAME"'","arn:aws:s3:::'"$BUCKET_NAME"'/*"]
      },
      {
        "Effect": "Allow",
        "Action": ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:DeleteItem"],
        "Resource": "arn:aws:dynamodb:'"$REGION"':*:table/barberstack-terraform-locks"
      },
      {
        "Effect": "Allow",
        "Action": ["ec2:*","rds:*","iam:*","ssm:*","amplify:*","ecr:*","elasticloadbalancing:*","kms:*"],
        "Resource": "*"
      }
    ]
  }' \
  --profile barberstack-bootstrap
```

---

## 4. Key Pair SSH — Acesso ao EC2

```bash
aws ec2 create-key-pair \
  --key-name barberstack-key \
  --query "KeyMaterial" \
  --output text \
  --region "$REGION" \
  --profile barberstack-bootstrap \
  > ~/.ssh/barberstack-key.pem

chmod 400 ~/.ssh/barberstack-key.pem

echo "Chave salva em ~/.ssh/barberstack-key.pem"
# GitHub Secret: EC2_SSH_KEY = conteúdo do arquivo acima
cat ~/.ssh/barberstack-key.pem
```

---

## 5. SSM Parameter Store — Todos os secrets da aplicação

> Estes valores **nunca entram no GitHub**. Ficam no AWS SSM.

```bash
# Gera JWT Secret forte
JWT_SECRET=$(openssl rand -hex 32)

# Cria os parâmetros (SecureString = criptografado com KMS)
aws ssm put-parameter \
  --name "/barberstack/production/DB_PASSWORD" \
  --type "SecureString" \
  --value "TROCA_POR_SENHA_FORTE_AQUI" \
  --region "$REGION" \
  --profile barberstack-bootstrap

aws ssm put-parameter \
  --name "/barberstack/production/JWT_SECRET" \
  --type "SecureString" \
  --value "$JWT_SECRET" \
  --region "$REGION" \
  --profile barberstack-bootstrap

aws ssm put-parameter \
  --name "/barberstack/production/ASAAS_MASTER_API_KEY" \
  --type "SecureString" \
  --value "\$aact_COLE_SUA_CHAVE_ASAAS_AQUI" \
  --region "$REGION" \
  --profile barberstack-bootstrap

aws ssm put-parameter \
  --name "/barberstack/production/GITHUB_TOKEN" \
  --type "SecureString" \
  --value "ghp_COLE_SEU_TOKEN_GITHUB_AQUI" \
  --region "$REGION" \
  --profile barberstack-bootstrap

echo "Parâmetros criados. Verifique em: AWS Console → Systems Manager → Parameter Store"
```

Para atualizar um parâmetro no futuro:
```bash
aws ssm put-parameter \
  --name "/barberstack/production/DB_PASSWORD" \
  --type "SecureString" \
  --value "NOVA_SENHA" \
  --overwrite \
  --region "$REGION" \
  --profile barberstack-bootstrap
```

---

## 6. GitHub Secrets (apenas 5 + 2 pós-infra)

Vai em: **GitHub → repositório → Settings → Secrets and variables → Actions**

### Configura agora (antes do primeiro push):

| Secret | Valor |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Da etapa 3 |
| `AWS_SECRET_ACCESS_KEY` | Da etapa 3 |
| `AWS_REGION` | `us-east-1` |
| `TF_BACKEND_BUCKET` | Nome do bucket da etapa 1 |
| `TF_BACKEND_DYNAMODB_TABLE` | `barberstack-terraform-locks` |
| `EC2_SSH_KEY` | Conteúdo do `~/.ssh/barberstack-key.pem` |

### Configura após o primeiro `terraform apply` (outputs):

| Secret | Como obter |
|--------|------------|
| `EC2_HOST` | `terraform output ec2_public_ip` |

> Não há `DATABASE_URL` no GitHub — a conexão ao banco é feita **de dentro do EC2**
> (EC2 está na mesma VPC que o RDS, porta 5432 liberada no Security Group).

---

## 7. Push inicial

```bash
cd c:/Users/kwnsi/Downloads/barberstack
git remote add origin https://github.com/SEU-USUARIO/barberstack.git
git add .
git commit -m "feat: initial barberstack scaffold"
git push -u origin main
```

A pipeline `Infrastructure — Terraform` dispara automaticamente.
Aguarda ~10 min e pega os outputs:

```bash
# No terminal, após a pipeline terminar:
cd infrastructure/terraform
terraform init \
  -backend-config="bucket=BUCKET_NAME" \
  -backend-config="key=production/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=barberstack-terraform-locks"

terraform output ec2_public_ip
```

---

## 8. Migrations — dentro do EC2

```bash
# Conecta ao EC2
ssh -i ~/.ssh/barberstack-key.pem ubuntu@$(terraform output -raw ec2_public_ip)

# Dentro do EC2 — .env já foi gerado do SSM pelo userdata
cd /opt/barberstack
cat .env  # confirma que as variáveis estão lá

# Roda as migrations
npx prisma migrate deploy \
  --schema=packages/database/prisma/schema.prisma

# Seed de demonstração (opcional)
npx ts-node packages/database/prisma/seed.ts
```

---

## Resumo dos GitHub Secrets

```
AWS_ACCESS_KEY_ID          ← credencial CI
AWS_SECRET_ACCESS_KEY      ← credencial CI
AWS_REGION                 ← us-east-1
TF_BACKEND_BUCKET          ← nome do bucket S3
TF_BACKEND_DYNAMODB_TABLE  ← barberstack-terraform-locks
EC2_SSH_KEY                ← conteúdo do .pem
EC2_HOST                   ← IP do EC2 (preenche após terraform apply)
```

**Tudo mais** (senhas, tokens, API keys) fica no SSM em `/barberstack/production/*`.
