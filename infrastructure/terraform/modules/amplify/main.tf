resource "aws_amplify_app" "frontend" {
  name       = "${var.project}-${var.environment}"
  repository = var.github_repo
  platform   = "WEB_COMPUTE"

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
        baseDirectory: frontend/web/.next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - frontend/web/.next/cache/**/*
  EOT

  environment_variables = {
    # EC2_URL: server-side apenas (sem NEXT_PUBLIC_) — nunca exposto ao browser
    EC2_URL                   = var.ec2_url
    NODE_ENV                  = var.environment
    # Necessário para WEB_COMPUTE detectar Next.js em monorepo
    AMPLIFY_MONOREPO_APP_ROOT = "frontend/web"
  }

  # Next.js SSR — Amplify gerencia o roteamento automaticamente via compute.
  # Regra SPA (/<*> → /index.html) não se aplica aqui e causa redirect loop.

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
