# =============================================================================
# SSM Parameter Store — Barberstack
#
# Terraform cria todos os parâmetros automaticamente na primeira execução.
# Parâmetros auto-gerados: DB_PASSWORD, JWT_SECRET
# Placeholders (atualizar no console SSM):
#   ASAAS_MASTER_API_KEY, ASAAS_TRANSFER_VALIDATION_TOKEN,
#   GITHUB_TOKEN, DATABASE_URL, WHATSAPP_API_TOKEN, WHATSAPP_API_URL
#
# lifecycle { ignore_changes = [value] } garante que edições feitas no console
# SSM não sejam sobrescritas em applies futuros do Terraform.
# =============================================================================

locals {
  prefix = "/${var.project}/${var.environment}"
}

# ─── Geração de valores para os parâmetros que podem ser auto-gerados ─────────

resource "random_password" "db" {
  length           = 24
  special          = true
  override_special = "!#$%&*()-_=+[]?"
}

resource "random_id" "jwt" {
  byte_length = 32 # resulta em 64 chars hexadecimais
}

# ─── Parâmetros SSM ───────────────────────────────────────────────────────────

resource "aws_ssm_parameter" "db_password" {
  name        = "${local.prefix}/DB_PASSWORD"
  type        = "SecureString"
  value       = random_password.db.result
  description = "Barberstack — senha master do banco RDS"

  lifecycle {
    ignore_changes = [value] # edições no console SSM são preservadas
  }

  tags = { Name = "${var.project}-${var.environment}-db-password" }
}

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "${local.prefix}/JWT_SECRET"
  type        = "SecureString"
  value       = random_id.jwt.hex
  description = "Barberstack — segredo de assinatura JWT"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${var.project}-${var.environment}-jwt-secret" }
}

resource "aws_ssm_parameter" "asaas_master_api_key" {
  name        = "${local.prefix}/ASAAS_MASTER_API_KEY"
  type        = "SecureString"
  value       = "PLACEHOLDER_ATUALIZE_NO_CONSOLE_SSM"
  description = "Barberstack — API Key master Asaas | Atualize em: SSM Console > /barberstack/production/ASAAS_MASTER_API_KEY"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${var.project}-${var.environment}-asaas-key" }
}

resource "aws_ssm_parameter" "github_token" {
  name        = "${local.prefix}/GITHUB_TOKEN"
  type        = "SecureString"
  value       = "PLACEHOLDER_ATUALIZE_NO_CONSOLE_SSM"
  description = "Barberstack — GitHub PAT para o Amplify | Atualize em: SSM Console > /barberstack/production/GITHUB_TOKEN"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${var.project}-${var.environment}-github-token" }
}

# ─── Database ─────────────────────────────────────────────────────────────────

resource "aws_ssm_parameter" "database_url" {
  name        = "${local.prefix}/DATABASE_URL"
  type        = "SecureString"
  value       = "PLACEHOLDER_postgresql://barberstack:SENHA@HOST:5432/barberstack"
  description = "Barberstack — Connection string PostgreSQL | Formato: postgresql://user:pass@host:5432/db"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${var.project}-${var.environment}-database-url" }
}

# ─── JWT ──────────────────────────────────────────────────────────────────────

resource "aws_ssm_parameter" "jwt_expires_in" {
  name        = "${local.prefix}/JWT_EXPIRES_IN"
  type        = "String"
  value       = "7d"
  description = "Barberstack — Expiração dos tokens JWT (ex: 7d, 24h)"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${var.project}-${var.environment}-jwt-expires-in" }
}

# ─── API Gateway ──────────────────────────────────────────────────────────────

resource "aws_ssm_parameter" "allowed_origins" {
  name        = "${local.prefix}/ALLOWED_ORIGINS"
  type        = "String"
  value       = "https://barberstack.kwnsilva.com.br"
  description = "Barberstack — CORS origens permitidas (separadas por vírgula)"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${var.project}-${var.environment}-allowed-origins" }
}

# ─── Asaas ────────────────────────────────────────────────────────────────────

resource "aws_ssm_parameter" "asaas_env" {
  name        = "${local.prefix}/ASAAS_ENV"
  type        = "String"
  value       = "sandbox"
  description = "Barberstack — Ambiente Asaas: 'sandbox' ou 'production'"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${var.project}-${var.environment}-asaas-env" }
}

resource "aws_ssm_parameter" "asaas_transfer_validation_token" {
  name        = "${local.prefix}/ASAAS_TRANSFER_VALIDATION_TOKEN"
  type        = "SecureString"
  value       = "PLACEHOLDER_ATUALIZE_NO_CONSOLE_SSM"
  description = "Barberstack — Token secreto para validar webhooks de saque Asaas | Gere com: openssl rand -hex 32"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${var.project}-${var.environment}-asaas-transfer-token" }
}

# ─── WhatsApp / Notificações ──────────────────────────────────────────────────

resource "aws_ssm_parameter" "whatsapp_api_url" {
  name        = "${local.prefix}/WHATSAPP_API_URL"
  type        = "String"
  value       = "PLACEHOLDER_ATUALIZE_NO_CONSOLE_SSM"
  description = "Barberstack — URL da API de WhatsApp (ex: Evolution API)"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${var.project}-${var.environment}-whatsapp-url" }
}

resource "aws_ssm_parameter" "whatsapp_api_token" {
  name        = "${local.prefix}/WHATSAPP_API_TOKEN"
  type        = "SecureString"
  value       = "PLACEHOLDER_ATUALIZE_NO_CONSOLE_SSM"
  description = "Barberstack — Token de autenticação da API de WhatsApp"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${var.project}-${var.environment}-whatsapp-token" }
}

# ─── Leitura dos valores (para passar ao EC2/RDS/Amplify) ─────────────────────

data "aws_ssm_parameter" "db_password" {
  name            = aws_ssm_parameter.db_password.name
  with_decryption = true
  depends_on      = [aws_ssm_parameter.db_password]
}

data "aws_ssm_parameter" "jwt_secret" {
  name            = aws_ssm_parameter.jwt_secret.name
  with_decryption = true
  depends_on      = [aws_ssm_parameter.jwt_secret]
}

data "aws_ssm_parameter" "github_token" {
  name            = aws_ssm_parameter.github_token.name
  with_decryption = true
  depends_on      = [aws_ssm_parameter.github_token]
}

# ─── IAM Policy — permite ao EC2 ler todos os parâmetros do path ──────────────

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_iam_policy" "ssm_read" {
  name        = "${var.project}-${var.environment}-ssm-read"
  description = "EC2 pode ler parâmetros do SSM em ${local.prefix}/*"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SSMReadPath"
        Effect = "Allow"
        Action = [
          "ssm:GetParametersByPath",
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = [
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${local.prefix}",
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${local.prefix}/*"
        ]
      },
      {
        Sid    = "KMSDecryptSSM"
        Effect = "Allow"
        Action = ["kms:Decrypt"]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:ViaService" = "ssm.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })
}
