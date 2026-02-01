output "apprunner_access_role_arn" {
  description = "ARN of App Runner ECR access role"
  value       = aws_iam_role.apprunner_access.arn
}

output "apprunner_instance_role_arn" {
  description = "ARN of App Runner instance role"
  value       = aws_iam_role.apprunner_instance.arn
}
