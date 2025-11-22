from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions


schema_view = get_schema_view(
    openapi.Info(
        title="ER Simulator Voice API",
        default_version="v1",
        description="Voice-to-voice AI simulation endpoints",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)


def healthcheck_view(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", healthcheck_view, name="healthcheck"),
    path("api/voice/", include("voice.urls")),
    path("api/sim/", include("sim.urls")),
    path(
        "docs/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
]
