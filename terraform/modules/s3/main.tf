resource "aws_s3_bucket" "profile_images" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_versioning" "profile_images" {
  bucket = aws_s3_bucket.profile_images.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "profile_images" {
  bucket = aws_s3_bucket.profile_images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "profile_images" {
  bucket = aws_s3_bucket.profile_images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "profile_images_public_read" {
  bucket = aws_s3_bucket.profile_images.id

  depends_on = [aws_s3_bucket_public_access_block.profile_images]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.profile_images.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "profile_images" {
  bucket = aws_s3_bucket.profile_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
