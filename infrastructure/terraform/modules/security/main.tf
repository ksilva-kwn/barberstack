variable "project"     { type = string }
variable "environment" { type = string }
variable "vpc_id"      { type = string }

# ─── EC2 Security Group ───────────────────────────────────────────────────────
resource "aws_security_group" "ec2" {
  name        = "${var.project}-${var.environment}-ec2-sg"
  description = "Barberstack EC2 - API Gateway"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP - public (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS - public for API"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "API Gateway (3000) - VPC only"
    from_port   = 3000
    to_port     = 3006
    protocol    = "tcp"
    cidr_blocks = ["10.100.0.0/16"]
  }

  ingress {
    description = "API ports - admin IP"
    from_port   = 3000
    to_port     = 3006
    protocol    = "tcp"
    cidr_blocks = ["177.221.17.218/32"]
  }

  ingress {
    description = "SSH - public (key-based auth)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-${var.environment}-ec2-sg" }
}

# ─── RDS Security Group ───────────────────────────────────────────────────────
resource "aws_security_group" "rds" {
  name        = "${var.project}-${var.environment}-rds-sg"
  description = "Barberstack RDS - PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-${var.environment}-rds-sg" }
}

output "ec2_sg_id" { value = aws_security_group.ec2.id }
output "rds_sg_id" { value = aws_security_group.rds.id }
