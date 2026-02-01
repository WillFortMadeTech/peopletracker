terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "sagetracker-terraform-state"
    key            = "sagetracker/terraform.tfstate"
    region         = "eu-west-2"
    dynamodb_table = "sagetracker-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "sagetracker"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "ecr" {
  source = "./modules/ecr"

  repository_name = var.app_name
}

module "dynamodb" {
  source = "./modules/dynamodb"

  environment = var.environment
}

module "s3" {
  source = "./modules/s3"

  bucket_name = "${var.app_name}-profile-images-${var.environment}"
  environment = var.environment
}

module "iam" {
  source = "./modules/iam"

  app_name         = var.app_name
  environment      = var.environment
  dynamodb_arns    = module.dynamodb.table_arns
  s3_bucket_arn    = module.s3.bucket_arn
  ecr_repository_arn = module.ecr.repository_arn
}

module "apprunner" {
  source = "./modules/apprunner"

  app_name              = var.app_name
  environment           = var.environment
  ecr_repository_url    = module.ecr.repository_url
  image_tag             = var.image_tag
  access_role_arn       = module.iam.apprunner_access_role_arn
  instance_role_arn     = module.iam.apprunner_instance_role_arn
  jwt_secret            = var.jwt_secret
  aws_region            = var.aws_region
  s3_bucket_name        = module.s3.bucket_name
}
