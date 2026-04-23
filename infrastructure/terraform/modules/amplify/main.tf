resource "aws_amplify_app" "frontend" {
  name       = "${var.project}-${var.environment}"
  repository = var.github_repo
  platform   = "WEB_COMPUTE"

  access_token = var.github_token

  build_spec = <<-EOT
    version: 1
    applications:
      - appRoot: frontend/web
        frontend:
          phases:
            preBuild:
              commands:
                - npm install -g pnpm@9
                - cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile && cd frontend/web
            build:
              commands:
                - pnpm run build
          artifacts:
            baseDirectory: .next
            files:
              - '**/*'
          cache:
            paths:
              - .next/cache/**/*
  EOT

  environment_variables = {
    NEXT_PUBLIC_API_URL                = var.api_url
    NODE_ENV                           = var.environment
    AMPLIFY_MONOREPO_APP_ROOT          = "frontend/web"
    NEXT_PUBLIC_TURNSTILE_SITE_KEY     = var.turnstile_site_key
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

  enable_auto_build         = true
  enable_performance_mode   = false
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
