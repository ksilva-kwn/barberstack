# =============================================================================
# SSM Parameter Store — Barberstack
#
# Terraform cria todos os parâmetros automaticamente na primeira execução:
#   - DB_PASSWORD  → senha aleatória gerada pelo Terraform
#   - JWT_SECRET   → hex aleatório gerado pelo Terraform
#   - ASAAS_MASTER_API_KEY → placeholder — você atualiza no console SSM
#   - GITHUB_TOKEN         → placeholder — você atualiza no console SSM
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
