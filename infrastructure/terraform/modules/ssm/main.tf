# =============================================================================
# SSM Parameter Store — lê parâmetros criados manualmente (ver SETUP.md)
# O Terraform NÃO cria os valores — apenas os lê e configura o acesso do EC2.
# Caminho dos parâmetros: /{project}/{environment}/*
# =============================================================================

locals {
  prefix = "/${var.project}/${var.environment}"
}

# ─── Leitura dos parâmetros existentes no SSM ─────────────────────────────────

data "aws_ssm_parameter" "db_password" {
  name            = "${local.prefix}/DB_PASSWORD"
  with_decryption = true
}

data "aws_ssm_parameter" "jwt_secret" {
  name            = "${local.prefix}/JWT_SECRET"
  with_decryption = true
}

data "aws_ssm_parameter" "asaas_master_api_key" {
  name            = "${local.prefix}/ASAAS_MASTER_API_KEY"
  with_decryption = true
}

data "aws_ssm_parameter" "github_token" {
  name            = "${local.prefix}/GITHUB_TOKEN"
  with_decryption = true
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
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${local.prefix}/*"
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
