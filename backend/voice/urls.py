from django.urls import path

from . import views


urlpatterns = [
    path("transcribe", views.transcribe_view, name="voice-transcribe"),
    path("respond", views.respond_view, name="voice-respond"),
    path("speak", views.speak_view, name="voice-speak"),
    path("full", views.full_pipeline_view, name="voice-full"),
]
