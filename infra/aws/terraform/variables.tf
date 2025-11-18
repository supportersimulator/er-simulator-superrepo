variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Short name used for tagging and naming resources"
  type        = string
  default     = "ersim"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "ersim_prod"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "ersim_app"
}

variable "db_password" {
  description = "PostgreSQL master password (set via tfvars or environment)"
  type        = string
  sensitive   = true
}

variable "app_instance_type" {
  description = "EC2 instance type for Elastic Beanstalk"
  type        = string
  default     = "t3.small"
}

variable "s3_assets_bucket_name" {
  description = "Name of the S3 bucket for core app assets"
  type        = string
  default     = "ersimulator-core-assets"
}
