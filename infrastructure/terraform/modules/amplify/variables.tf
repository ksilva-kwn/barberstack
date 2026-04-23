variable "project"     { type = string }
variable "environment" { type = string }
variable "github_repo" { type = string }

variable "github_token" {
  type      = string
  sensitive = true
}

variable "api_url" {
  type        = string
  description = "URL publica da API (https://api.barberstack.kwnsilva.com.br). Exposta ao browser via NEXT_PUBLIC_API_URL."
}

variable "custom_domain" {
  type        = string
  description = "Dominio customizado para o Amplify (ex: barberstack.kwnsilva.com.br)"
}

variable "turnstile_site_key" {
  type        = string
  description = "Cloudflare Turnstile site key (public) — exposta via NEXT_PUBLIC_TURNSTILE_SITE_KEY"
  default     = ""
}
