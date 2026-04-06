output "endpoint" {
  value     = aws_db_instance.postgres.address
  sensitive = true
}

output "port" {
  value = aws_db_instance.postgres.port
}
