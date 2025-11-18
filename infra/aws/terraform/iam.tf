# Backend compute role (for Elastic Beanstalk EC2 instances)
resource "aws_iam_role" "backend" {
  name = "${var.project_name}-backend-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = ["ec2.amazonaws.com", "elasticbeanstalk.amazonaws.com"]
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "backend_policy" {
  name = "${var.project_name}-backend-policy"
  role = aws_iam_role.backend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3AssetsAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          aws_s3_bucket.assets.arn,
          "${aws_s3_bucket.assets.arn}/*",
        ]
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "*"
      }
    ]
  })
}

# Security group for app instances / Beanstalk
resource "aws_security_group" "app" {
  name        = "${var.project_name}-app-sg"
  description = "App/Beanstalk instances"
  vpc_id      = aws_vpc.main.id

  # Inbound HTTP from anywhere (you can later restrict via ALB/WAF)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-app-sg"
  }
}

# CI/CD deploy role (for EB deploy + ECR push)
resource "aws_iam_role" "deploy" {
  name = "${var.project_name}-deploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "deploy_policy" {
  name = "${var.project_name}-deploy-policy"
  role = aws_iam_role.deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ElasticBeanstalkDeploy"
        Effect = "Allow"
        Action = [
          "elasticbeanstalk:*",
          "autoscaling:*",
          "elasticloadbalancing:*",
          "cloudformation:*",
          "ec2:*",
          "s3:*",
          "cloudwatch:*",
        ]
        Resource = "*"
      },
      {
        Sid    = "ECRPush"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
        ]
        Resource = "*"
      }
    ]
  })
}
