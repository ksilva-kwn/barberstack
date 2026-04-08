output "app_id"  { value = aws_amplify_app.frontend.id }
output "app_url" { value = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.frontend.default_domain}" }
output "custom_domain_url" { value = "https://${var.custom_domain}" }

# Registros DNS que precisam ser adicionados no Cloudflare
output "dns_validation_records" {
  value = aws_amplify_domain_association.frontend.certificate_verification_dns_record
}
