###############################################
# FIND LATEST AMAZON LINUX 2023 AMI
###############################################
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

###############################################
# SSH KEY PAIR (public key only)
###############################################
resource "aws_key_pair" "ersim_key" {
  key_name   = "ersim-keypair"
  public_key = var.public_ssh_key
}

###############################################
# APP EC2 INSTANCE
###############################################
resource "aws_instance" "app" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.sg_app.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_instance_profile.name
  key_name               = aws_key_pair.ersim_key.key_name

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
  }

  user_data = <<-EOF
#!/bin/bash
set -euxo pipefail

############################################
# Update System & Install Dependencies
############################################
dnf update -y
dnf install -y git nginx python3.11 python3.11-pip

############################################
# Install and enable SSM Agent (AL2023 compatible)
############################################
dnf install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

############################################
# Create Application Directory
############################################
mkdir -p /var/www/ersim
cd /var/www/ersim

############################################
# Clone Superrepo (Backend lives in /backend)
############################################
if [ ! -d app ]; then
  git clone https://github.com/supportersimulator/er-simulator-superrepo.git app
fi

cd /var/www/ersim/app/backend

############################################
# Python Dependencies
############################################
python3.11 -m pip install --upgrade pip
python3.11 -m pip install -r requirements.txt

############################################
# Django Setup
############################################
python3.11 manage.py migrate --noinput || true
python3.11 manage.py collectstatic --noinput || true

############################################
# Gunicorn Systemd Service
############################################
cat > /etc/systemd/system/gunicorn.service << 'UNIT'
[Unit]
Description=Gunicorn daemon for ERSIM Backend
After=network.target

[Service]
User=ec2-user
Group=nginx
WorkingDirectory=/var/www/ersim/app/backend
ExecStart=/usr/bin/python3.11 -m gunicorn ersim_backend.wsgi:application \
  --workers 3 \
  --bind unix:/run/gunicorn.sock
Restart=always
Environment=DJANGO_SETTINGS_MODULE=ersim_backend.settings.production
Environment=DJANGO_ENV=production

[Install]
WantedBy=multi-user.target
UNIT

mkdir -p /run

############################################
# Nginx Configuration
############################################
cat > /etc/nginx/conf.d/ersim.conf << 'NGINXCONF'
server {
    listen 80;
    server_name _;

    location = /favicon.ico { access_log off; log_not_found off; }

    location /static/ {
        alias /var/www/ersim/app/backend/static/;
    }

    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://unix:/run/gunicorn.sock;
    }
}
NGINXCONF

rm -f /etc/nginx/conf.d/default.conf || true

############################################
# Start Services
############################################
systemctl daemon-reload
systemctl enable gunicorn
systemctl restart gunicorn
systemctl enable nginx
systemctl restart nginx

EOF

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-instance"
    Environment = var.environment
  }
}

###############################################
# Elastic IP for EC2 instance
###############################################
resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-eip"
    Environment = var.environment
  }
}

###############################################
# Attach instance to ALB target group
###############################################
resource "aws_lb_target_group_attachment" "app" {
  target_group_arn = aws_lb_target_group.app.arn
  target_id        = aws_instance.app.id
  port             = 80
}
