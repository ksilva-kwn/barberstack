variable "project"     { type = string }
variable "environment" { type = string }
variable "github_repo" { type = string }
variable "api_url"     { type = string }

variable "github_token" {
  type      = string
  sensitive = true
}
