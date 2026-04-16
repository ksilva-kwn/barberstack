terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Backend S3 criado automaticamente pela pipeline antes do terraform init
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "barberstack"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# =============================================================================
# MÓDULOS
# =============================================================================

# SSM primeiro: cria os parâmetros (ou lê se já existem via ignore_changes)
module "ssm" {
  source      = "./modules/ssm"
  project     = var.project
  environment = var.environment
}

module "vpc" {
  source      = "./modules/vpc"
  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region
}

module "security" {
  source      = "./modules/security"
  project     = var.project
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
}

module "ec2" {
  source                = "./modules/ec2"
  project               = var.project
  environment           = var.environment
  aws_region            = var.aws_region
  vpc_id                = module.vpc.vpc_id
  public_subnet_id      = module.vpc.public_subnet_ids[0]
  ec2_security_group_id = module.security.ec2_sg_id
  instance_type         = var.ec2_instance_type
  key_name              = var.ec2_key_name
  ssm_path_prefix       = module.ssm.ssm_path_prefix
  ssm_policy_arn        = module.ssm.ssm_policy_arn
}

module "amplify" {
  source        = "./modules/amplify"
  project       = var.project
  environment   = var.environment
  github_repo   = var.github_repo
  github_token  = module.ssm.github_token
  api_url       = "https://api.barberstack.kwnsilva.com.br"
  custom_domain = "barberstack.kwnsilva.com.br"
}

# =============================================================================
# SSM — Parâmetros adicionais (construídos após RDS e SSM estarem prontos)
# =============================================================================

# DATABASE_URL — gerenciado manualmente no SSM Console (aponta para srv-rds-001)
resource "aws_ssm_parameter" "database_url" {
  name        = "/barberstack/${var.environment}/DATABASE_URL"
  type        = "SecureString"
  value       = "MANAGED_MANUALLY_IN_SSM_CONSOLE"
  description = "Barberstack — URL de conexão com o banco PostgreSQL"

  lifecycle {
    ignore_changes = [value]
  }
}

# JWT_EXPIRES_IN — padrão 7d, editável no console SSM
resource "aws_ssm_parameter" "jwt_expires_in" {
  name        = "/barberstack/${var.environment}/JWT_EXPIRES_IN"
  type        = "String"
  value       = "7d"
  description = "Barberstack — expiração do JWT"

  lifecycle {
    ignore_changes = [value]
  }
}

# WHATSAPP_API_TOKEN — placeholder até integração WhatsApp
resource "aws_ssm_parameter" "whatsapp_api_token" {
  name        = "/barberstack/${var.environment}/WHATSAPP_API_TOKEN"
  type        = "SecureString"
  value       = "PLACEHOLDER_ATUALIZE_NO_CONSOLE_SSM"
  description = "Barberstack — Token da API WhatsApp | Atualize em: SSM Console"

  lifecycle {
    ignore_changes = [value]
  }
}

# WHATSAPP_API_URL — placeholder até integração WhatsApp
resource "aws_ssm_parameter" "whatsapp_api_url" {
  name        = "/barberstack/${var.environment}/WHATSAPP_API_URL"
  type        = "String"
  value       = "PLACEHOLDER_ATUALIZE_NO_CONSOLE_SSM"
  description = "Barberstack — URL da API WhatsApp | Atualize em: SSM Console"

  lifecycle {
    ignore_changes = [value]
  }
}

# ALLOWED_ORIGINS — atualizar com URL do Amplify após primeiro deploy
resource "aws_ssm_parameter" "allowed_origins" {
  name        = "/barberstack/${var.environment}/ALLOWED_ORIGINS"
  type        = "String"
  value       = "*"
  description = "Barberstack — Origins permitidas no CORS | Atualize com a URL do Amplify"

  lifecycle {
    ignore_changes = [value]
  }
}
