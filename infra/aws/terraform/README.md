# ER Simulator AWS Terraform Infrastructure

This Terraform project provisions the core AWS backend infrastructure for the ER Simulator voice engine and Django backend.

It creates:

- A VPC with public and private subnets, NAT gateway, and routing
- A private S3 bucket for app assets (versioned, encrypted, private)
- A production PostgreSQL RDS instance
- A Redis (ElastiCache) cluster
- IAM roles for backend compute and CI/CD deploys
- An Elastic Beanstalk application and environment (Python 3.12)

## 1. Prerequisites

- Terraform v1.6.0 or later
- AWS CLI configured with an account that can create VPC, RDS, ElastiCache, IAM, S3, and Elastic Beanstalk resources
- An S3 bucket name that is globally unique (defaults to `ersimulator-core-assets` but you may change it via `terraform.tfvars`)

## 2. Directory

From the repo root:

```bash
cd infra/aws/terraform
```

## 3. Configure Variables

Copy the example tfvars file and edit it:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and at minimum set:

- `db_password` – a strong Postgres password
- Optionally adjust:
  - `project_name`
  - `s3_assets_bucket_name` (must be unique)
  - `app_instance_type`

## 4. Initialize and Apply

Initialize Terraform:

```bash
terraform init
```

Review the plan:

```bash
terraform plan
```

Apply the infrastructure:

```bash
terraform apply
```

Confirm when prompted. Provisioning RDS/ElastiCache/Beanstalk may take several minutes.

## 5. Outputs and Environment Variables

After `terraform apply` completes, Terraform will print several outputs.

The key ones to copy into your `.env.production` (and optionally `.env.development`) are:

### RDS Postgres

- **Output:** `rds_database_url`
- **Example format:**

  ```text
  postgres://ersim_app:<DB_PASSWORD>@ersim-prod-db.<RDS-ENDPOINT-HASH>.us-west-2.rds.amazonaws.com:5432/ersim_prod
  ```

Paste this into:

- `DATABASE_URL` in `backend/.env.production`

### Redis (ElastiCache)

- **Output:** `redis_url`
- **Example format:**

  ```text
  redis://ersim-prod-redis.<ELASTICACHE-ENDPOINT-HASH>.us-west-2.cache.amazonaws.com:6379/0
  ```

Paste this into:

- `REDIS_URL` in `backend/.env.production`

### S3 Assets Bucket

- **Outputs:**
  - `assets_bucket_name`
  - `assets_bucket_region`

Paste into:

- `AWS_S3_BUCKET` = `assets_bucket_name`
- `AWS_S3_REGION` = `assets_bucket_region`

### Elastic Beanstalk

- **Outputs:**
  - `beanstalk_environment_url` – the EB environment URL
  - `beanstalk_alb_dns` – the ALB DNS name
  - `beanstalk_bucket` – the regional EB S3 bucket used for application bundles

You can use `beanstalk_environment_url` as the primary endpoint for the Django backend once the application code is deployed.

### IAM Roles

- **Outputs:**
  - `backend_role_arn`
  - `deploy_role_arn`

Use these ARNs in your CI/CD or AWS console when configuring:

- The instance profile for Elastic Beanstalk environments
- The role your deployment automation assumes when pushing new versions

## 6. Notes and Safety

- This Terraform configuration **does not** store or expose any API keys or secrets.
- All secrets should remain in your `.env.development` / `.env.production` files or your secret manager.
- The generated RDS and Redis URLs contain hostnames only; you are responsible for keeping actual passwords and API keys private.

## 7. Next Steps

Once infrastructure is provisioned and `.env.production` is updated:

1. Build and deploy the Django backend to the Elastic Beanstalk environment.
2. Update the mobile app and Next.js portal to point at the EB URL for the production API.
3. Gradually introduce production traffic while monitoring CloudWatch logs and metrics.
