resource "aws_apprunner_service" "main" {
  service_name = "${var.app_name}-${var.environment}"

  source_configuration {
    authentication_configuration {
      access_role_arn = var.access_role_arn
    }

    image_repository {
      image_configuration {
        port = "3000"
        runtime_environment_variables = {
          NODE_ENV         = "production"
          JWT_SECRET       = var.jwt_secret
          AWS_REGION       = var.aws_region
          S3_BUCKET_NAME   = var.s3_bucket_name
        }
      }
      image_identifier      = "${var.ecr_repository_url}:${var.image_tag}"
      image_repository_type = "ECR"
    }

    auto_deployments_enabled = false
  }

  instance_configuration {
    cpu               = "256"
    memory            = "512"
    instance_role_arn = var.instance_role_arn
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/api/health"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.main.arn
}

resource "aws_apprunner_auto_scaling_configuration_version" "main" {
  auto_scaling_configuration_name = "${var.app_name}-${var.environment}"

  min_size = 1
  max_size = 1

  tags = {
    Name = "${var.app_name}-autoscaling"
  }
}
