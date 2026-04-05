output "ec2_public_ip" {
  description = "IP público da instância EC2 (Backend)"
  value       = module.ec2.public_ip
}

output "rds_endpoint" {
  description = "Endpoint do banco de dados RDS"
  value       = module.rds.endpoint
  sensitive   = true
}

output "amplify_url" {
  description = "URL do frontend no Amplify"
  value       = module.amplify.app_url
}

output "api_gateway_url" {
  description = "URL da API (via EC2)"
  value       = "http://${module.ec2.public_ip}:3000"
}
