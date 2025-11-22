from .base import *  # noqa

DEBUG = False
ALLOWED_HOSTS = [
    "ersimulator.com",
    ".ersimulator.com",
    "api.ersimulator.com",
    "ersim-prod-alb-261633148.us-west-2.elb.amazonaws.com",
    "35.82.113.186",
    "localhost",
]

# SSL/HTTPS settings
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
