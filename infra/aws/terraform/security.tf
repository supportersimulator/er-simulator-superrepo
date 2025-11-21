###############################################
# ALB SECURITY GROUP — allow HTTP from Internet
###############################################
resource "aws_security_group" "sg_alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "ALB ingress from internet"
  vpc_id      = aws_vpc.main.id

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
    Name        = "${var.project_name}-${var.environment}-alb-sg"
    Environment = var.environment
  }
}

#######################################################
# EC2 / APP SECURITY GROUP — SSH from world, HTTP from ALB
#######################################################
resource "aws_security_group" "sg_app" {
  name        = "${var.project_name}-${var.environment}-ec2-sg"
  description = "EC2/app instances behind ALB"
  vpc_id      = aws_vpc.main.id

  # SSH for admin access (can be tightened later)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP from ALB only
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-ec2-sg"
    Environment = var.environment
  }
}

#######################################################
# DATABASE SECURITY GROUP — allow Postgres from EC2 SG
#######################################################
resource "aws_security_group" "sg_db" {
  name        = "${var.project_name}-${var.environment}-db-sg"
  description = "RDS access from app instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-sg"
    Environment = var.environment
  }
}

#######################################################
# REDIS SECURITY GROUP — allow Redis port from EC2 SG
#######################################################
resource "aws_security_group" "sg_redis" {
  name        = "${var.project_name}-${var.environment}-redis-sg"
  description = "Redis access from app instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis-sg"
    Environment = var.environment
  }
}