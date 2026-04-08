variable "project"     { type = string }
variable "environment" { type = string }
variable "github_repo" { type = string }

variable "github_token" {
  type      = string
  sensitive = true
}

variable "api_url" {
  type        = string
  description = "URL pública da EC2 (http://<IP>). Exposta ao browser via NEXT_PUBLIC_API_URL."
}
