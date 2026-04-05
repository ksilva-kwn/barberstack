# =============================================================================
# Apenas variáveis NÃO sensíveis.
# Secrets (db_password, jwt_secret, etc.) ficam no SSM Parameter Store.
# =============================================================================

variable "project" {
  type    = string
  default = "barberstack"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "db_username" {
  description = "Usuário master do RDS (não é secret)"
  type        = string
  default     = "barberstack"
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "ec2_instance_type" {
  type    = string
  default = "t3.small"
}

variable "ec2_key_name" {
  description = "Nome do key pair SSH criado manualmente (ver SETUP.md)"
  type        = string
  default     = "barberstack-key"
}

variable "github_repo" {
  description = "URL do repositório GitHub (não é secret)"
  type        = string
  # Definido pelo pipeline via TF_VAR_github_repo usando github.server_url/github.repository
}
