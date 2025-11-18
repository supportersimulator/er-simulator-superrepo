resource "aws_elastic_beanstalk_application" "app" {
  name        = "${var.project_name}-backend"
  description = "ER Simulator Django backend"
}

resource "aws_elastic_beanstalk_environment" "prod" {
  name                = "${var.project_name}-production"
  application         = aws_elastic_beanstalk_application.app.name
  solution_stack_name = "64bit Amazon Linux 2 v3.9.0 running Python 3.12"

  # Associate the app security group with the environment
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "SecurityGroups"
    value     = aws_security_group.app.id
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = var.app_instance_type
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "EnvironmentType"
    value     = "LoadBalanced"
  }

  # Stream application logs to CloudWatch
  setting {
    namespace = "aws:elasticbeanstalk:cloudwatch:logs"
    name      = "StreamLogs"
    value     = "true"
  }

  setting {
    namespace = "aws:elasticbeanstalk:cloudwatch:logs"
    name      = "RetentionInDays"
    value     = "7"
  }

  tags = {
    Name        = "${var.project_name}-prod-env"
    Environment = "production"
  }
}

# Find the ALB created by Elastic Beanstalk using tags
data "aws_lb" "eb" {
  # EB tags its load balancer with the environment name
  tags = {
    "elasticbeanstalk:environment-name" = aws_elastic_beanstalk_environment.prod.name
  }

  depends_on = [aws_elastic_beanstalk_environment.prod]
}

# Beanstalk S3 bucket (convention-based, not created here)
locals {
  eb_bucket_name = "elasticbeanstalk-${var.aws_region}-${data.aws_caller_identity.current.account_id}"
}
