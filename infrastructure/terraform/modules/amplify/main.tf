resource "aws_amplify_app" "frontend" {
  name       = "${var.project}-${var.environment}"
  repository = var.github_repo

  access_token = var.github_token

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm install -g pnpm
            - pnpm install --frozen-lockfile
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
    NEXT_PUBLIC_API_URL = var.api_url
    NODE_ENV            = var.environment
  }

  custom_rule {
    source = "/<*>"
    status = "404"
    target = "/index.html"
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
