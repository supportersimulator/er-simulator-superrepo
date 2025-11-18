resource "aws_db_subnet_group" "db" {
  name       = "${var.project_name}-db-subnets"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-db-subnets"
  }
}

resource "aws_security_group" "db" {
  name        = "${var.project_name}-db-sg"
  description = "RDS access from app instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = 5432
    to_port         = 5432
    security_groups = [aws_security_group.app.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-db-sg"
  }
}

resource "aws_db_instance" "postgres" {
  identifier              = "${var.project_name}-prod-db"
  allocated_storage       = 20
  max_allocated_storage   = 30
  storage_type            = "gp3"
  engine                  = "postgres"
  engine_version          = "15.5"
  instance_class          = "db.t3.micro"
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  port                    = 5432
  db_subnet_group_name    = aws_db_subnet_group.db.name
  vpc_security_group_ids  = [aws_security_group.db.id]
  multi_az                = false
  publicly_accessible     = false
  backup_retention_period = 7
  skip_final_snapshot     = false

  tags = {
    Name        = "${var.project_name}-prod-db"
    Environment = "production"
  }
}
