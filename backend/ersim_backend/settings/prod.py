from .base import *  # noqa

DEBUG = False
ALLOWED_HOSTS = [
    "ersimulator.com",
    ".ersimulator.com",
    "ersim-prod-alb-261633148.us-west-2.elb.amazonaws.com",
    "35.82.113.186",
    "localhost",
]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
# Temporarily disabled until HTTPS is set up on ALB
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
