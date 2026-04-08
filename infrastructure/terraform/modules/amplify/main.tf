resource "aws_amplify_app" "frontend" {
  name       = "${var.project}-${var.environment}"
  repository = var.github_repo
  platform   = "WEB"

  access_token = var.github_token

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm install -g pnpm
            - pnpm install --no-frozen-lockfile
        build:
          commands:
            - pnpm --filter @barberstack/web build
      artifacts:
        baseDirectory: frontend/web/out
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - frontend/web/.next/cache/**/*
  EOT

  environment_variables = {
    NEXT_PUBLIC_API_URL = var.api_url
    NODE_ENV            = var.environment
  }

  # SPA redirect: todas as rotas → index.html
  custom_rule {
    source = "/<*>"
    target = "/index.html"
    status = "404-200"
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = "main"

  framework = "Next.js - SSR"
  stage     = var.environment == "production" ? "PRODUCTION" : "DEVELOPMENT"

  enable_auto_build = true
}

# Custom domain — barberstack.kwnsilva.com.br
# Após o terraform apply, o Amplify vai gerar registros DNS para validação.
# Adicione-os no Cloudflare conforme o output "dns_validation_records".
resource "aws_amplify_domain_association" "frontend" {
  app_id      = aws_amplify_app.frontend.id
  domain_name = var.custom_domain

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""  # apex do subdomínio (barberstack.kwnsilva.com.br)
  }

  # Cloudflare gerencia o DNS — desabilita verificação automática via Route53
  enable_auto_sub_domain = false
}
