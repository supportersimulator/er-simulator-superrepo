aws_region       = "us-west-2"
project_name     = "ersim"

# VPC CIDRs (can usually stay as defaults unless they clash with existing networks)
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
public_subnet_azs    = ["us-west-2a", "us-west-2b"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
private_subnet_azs   = ["us-west-2a", "us-west-2b"]

# RDS configuration (production)
db_name     = "ersim_prod"
db_username = "ersim_app"
# IMPORTANT: this placeholder will be overridden by terraform.tfvars.local
db_password = "CHANGE_ME"

# EC2 app instance type
ec2_instance_type = "t3.medium"

# S3 assets buckets (must be globally unique; real values can live in terraform.tfvars.local)
assets_bucket_name   = "ersimulator-core-assets-831646886161"
assets_bucket_name_2 = "ersimulator-core-assets-logs-831646886161"