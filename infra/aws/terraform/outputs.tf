output "rds_endpoint" {
  description = "RDS endpoint hostname"
  value       = aws_db_instance.postgres.address
}

output "rds_database_url" {
  description = "PostgreSQL connection URL (fill in password manually if desired)"
  value       = "postgres://${var.db_username}:<DB_PASSWORD>@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${var.db_name}"
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_url" {
  description = "Redis URL for application configuration"
  value       = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379/0"
}

output "assets_bucket_name" {
  description = "S3 bucket name for core assets"
  value       = aws_s3_bucket.assets.bucket
}

output "assets_bucket_region" {
  description = "Region of the assets S3 bucket"
  value       = var.aws_region
}

output "beanstalk_environment_url" {
  description = "Elastic Beanstalk environment CNAME URL"
  value       = aws_elastic_beanstalk_environment.prod.endpoint_url
}

output "beanstalk_alb_dns" {
  description = "Application Load Balancer DNS name for the Beanstalk environment"
  value       = data.aws_lb.eb.dns_name
}

output "beanstalk_bucket" {
  description = "Elastic Beanstalk S3 bucket name (region/account-specific convention)"
  value       = local.eb_bucket_name
}

output "backend_role_arn" {
  description = "IAM role ARN for backend compute instances"
  value       = aws_iam_role.backend.arn
}

output "deploy_role_arn" {
  description = "IAM role ARN for CI/CD deployments"
  value       = aws_iam_role.deploy.arn
}
