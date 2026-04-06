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

module "rds" {
  source                = "./modules/rds"
  project               = var.project
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  rds_security_group_id = module.security.rds_sg_id
  db_username           = var.db_username
  db_password           = module.ssm.db_password   # gerado e guardado no SSM
  db_instance_class     = var.db_instance_class
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
  source       = "./modules/amplify"
  project      = var.project
  environment  = var.environment
  github_repo  = var.github_repo
  github_token = module.ssm.github_token   # lido do SSM
  api_url      = "http://${module.ec2.public_ip}:3000"
}
