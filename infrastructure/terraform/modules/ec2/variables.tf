variable "project"               { type = string }
variable "environment"           { type = string }
variable "aws_region"            { type = string }
variable "vpc_id"                { type = string }
variable "public_subnet_id"      { type = string }
variable "ec2_security_group_id" { type = string }
variable "key_name"              { type = string }

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "ssm_path_prefix" {
  type        = string
  description = "Prefixo SSM ex: /barberstack/production"
}

variable "ssm_policy_arn" {
  type        = string
  description = "ARN da IAM policy de leitura SSM"
}
