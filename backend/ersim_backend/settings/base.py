import os
from pathlib import Path

import environ


BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Determine environment mode for env-file loading only. Application behavior
# (dev vs prod settings module) is still controlled by DJANGO_SETTINGS_MODULE.
DJANGO_ENV = os.environ.get("DJANGO_ENV", "development")

# Initialise environment
env = environ.Env(
    DEBUG=(bool, False),
)

# Read environment-specific .env file if present, falling back to .env
for candidate in [
    BASE_DIR / f".env.{DJANGO_ENV}",
    BASE_DIR / ".env",
]:
    if candidate.exists():
        environ.Env.read_env(str(candidate))
        break


SECRET_KEY = env("DJANGO_SECRET_KEY", default="insecure-dev-key-change-me")
DEBUG = env.bool("DJANGO_DEBUG", default=True)

ALLOWED_HOSTS: list[str] = env.list("DJANGO_ALLOWED_HOSTS", default=["*"])


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "drf_yasg",
    # Project apps
    "users",
    "authbridge",
    "voice",
    "ai",
    "sessions",
    "sim",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "ersim_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "ersim_backend.wsgi.application"
ASGI_APPLICATION = "ersim_backend.asgi.application"


DATABASES = {
    "default": env.db(  # type: ignore[arg-type]
        "DATABASE_URL",
        default="postgres://postgres:postgres@localhost:5432/ersim_backend",
    )
}


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "authbridge.authentication.SupabaseJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}


REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")

# S3 buckets provisioned by Terraform
ERSIM_ASSETS_BUCKET = env("ERSIM_ASSETS_BUCKET", default="")
ERSIM_ASSETS_BUCKET_LOGS = env("ERSIM_ASSETS_BUCKET_LOGS", default="")

# CORS placeholders (to be wired with django-cors-headers if we add it later)
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])

# Supabase settings
SUPABASE_URL = env("SUPABASE_URL", default="")
SUPABASE_ANON_KEY = env("SUPABASE_ANON_KEY", default="")
SUPABASE_JWT_SECRET = env("SUPABASE_JWT_SECRET", default="")
