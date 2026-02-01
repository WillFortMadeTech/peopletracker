output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.ecr.repository_url
}

output "apprunner_service_url" {
  description = "App Runner service URL"
  value       = module.apprunner.service_url
}

output "apprunner_service_arn" {
  description = "App Runner service ARN"
  value       = module.apprunner.service_arn
}

output "dynamodb_table_names" {
  description = "DynamoDB table names"
  value       = module.dynamodb.table_names
}

output "s3_bucket_name" {
  description = "S3 bucket name for profile images"
  value       = module.s3.bucket_name
}
