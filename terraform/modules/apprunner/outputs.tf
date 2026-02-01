output "service_url" {
  description = "App Runner service URL"
  value       = "https://${aws_apprunner_service.main.service_url}"
}

output "service_arn" {
  description = "App Runner service ARN"
  value       = aws_apprunner_service.main.arn
}

output "service_id" {
  description = "App Runner service ID"
  value       = aws_apprunner_service.main.service_id
}
