# Valores lidos do SSM — sensíveis, nunca aparecem em logs
output "db_password" {
  value     = data.aws_ssm_parameter.db_password.value
  sensitive = true
}

output "jwt_secret" {
  value     = data.aws_ssm_parameter.jwt_secret.value
  sensitive = true
}

output "asaas_master_api_key" {
  value     = data.aws_ssm_parameter.asaas_master_api_key.value
  sensitive = true
}

output "github_token" {
  value     = data.aws_ssm_parameter.github_token.value
  sensitive = true
}

# Não sensíveis — usados pela EC2 e pela IAM policy
output "ssm_path_prefix" { value = "/${var.project}/${var.environment}" }
output "ssm_policy_arn"  { value = aws_iam_policy.ssm_read.arn }
