variable "project"              { type = string }
variable "environment"          { type = string }
variable "vpc_id"               { type = string }
variable "private_subnet_ids"   { type = list(string) }
variable "rds_security_group_id" { type = string }
variable "db_username"          { type = string; sensitive = true }
variable "db_password"          { type = string; sensitive = true }
variable "db_instance_class"    { type = string; default = "db.t3.micro" }
