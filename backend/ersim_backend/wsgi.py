import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ersim_backend.settings.dev")

application = get_wsgi_application()
