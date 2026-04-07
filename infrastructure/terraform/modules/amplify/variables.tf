variable "project"     { type = string }
variable "environment" { type = string }
variable "github_repo" { type = string }

variable "github_token" {
  type      = string
  sensitive = true
}

variable "ec2_url" {
  type        = string
  description = "URL interna da EC2 (api-gateway). Usada server-side pelo Amplify — nunca exposta ao browser."
}
