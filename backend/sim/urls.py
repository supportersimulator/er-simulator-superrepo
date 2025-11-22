from django.urls import path

from sim import views


urlpatterns = [
    path("respond/", views.sim_respond_view, name="sim-respond"),
    path("trigger-resource/", views.trigger_resource_view, name="sim-trigger-resource"),
]


