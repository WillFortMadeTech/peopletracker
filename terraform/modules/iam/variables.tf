variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "dynamodb_arns" {
  description = "ARNs of DynamoDB tables"
  type        = list(string)
}

variable "s3_bucket_arn" {
  description = "ARN of S3 bucket"
  type        = string
}

variable "ecr_repository_arn" {
  description = "ARN of ECR repository"
  type        = string
}
