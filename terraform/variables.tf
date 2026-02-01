variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "sagetracker"
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}
