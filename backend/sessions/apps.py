from django.apps import AppConfig


class SessionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "sessions"
    label = "ersim_sessions"  # Avoid conflict with django.contrib.sessions
