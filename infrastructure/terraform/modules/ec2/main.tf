data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-22.04-amd64-server-*"]
  }
}

# =============================================================================
# IAM — EC2 Instance Role (acesso ao SSM)
# =============================================================================

resource "aws_iam_role" "ec2" {
  name = "${var.project}-${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Política de leitura SSM (vinda do módulo ssm)
resource "aws_iam_role_policy_attachment" "ssm_read" {
  role       = aws_iam_role.ec2.name
  policy_arn = var.ssm_policy_arn
}

# Permite o SSM Session Manager (acesso sem SSH, boas práticas AWS)
resource "aws_iam_role_policy_attachment" "ssm_session" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# =============================================================================
# EC2 Instance
# =============================================================================

resource "aws_instance" "backend" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  key_name                    = var.key_name
  subnet_id                   = var.public_subnet_id
  vpc_security_group_ids      = [var.ec2_security_group_id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }

  # userdata só recebe o path prefix do SSM — nenhum segredo em texto claro
  user_data = templatefile("${path.module}/userdata.sh.tpl", {
    ssm_path_prefix = var.ssm_path_prefix
    aws_region      = var.aws_region
    project         = var.project
    environment     = var.environment
  })

  tags = { Name = "${var.project}-${var.environment}-backend" }

  lifecycle {
    create_before_destroy = true
  }
}

# Elastic IP
resource "aws_eip" "backend" {
  instance = aws_instance.backend.id
  domain   = "vpc"

  tags = { Name = "${var.project}-${var.environment}-eip" }
}
