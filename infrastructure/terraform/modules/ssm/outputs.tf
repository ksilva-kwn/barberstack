output "db_password" {
  value     = data.aws_ssm_parameter.db_password.value
  sensitive = true
}

output "github_token" {
  value     = data.aws_ssm_parameter.github_token.value
  sensitive = true
}

output "ssm_path_prefix" { value = "/${var.project}/${var.environment}" }
output "ssm_policy_arn"  { value = aws_iam_policy.ssm_read.arn }
