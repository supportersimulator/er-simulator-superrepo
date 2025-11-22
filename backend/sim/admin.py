from __future__ import annotations

from django.contrib import admin

from sim.models import SimCase, SimPrompt


@admin.register(SimPrompt)
class SimPromptAdmin(admin.ModelAdmin):
    list_display = ("key", "name", "is_active", "created_at")
    list_filter = ("key", "is_active")
    search_fields = ("key", "name", "description")
    readonly_fields = ("created_at", "updated_at")


@admin.register(SimCase)
class SimCaseAdmin(admin.ModelAdmin):
    list_display = ("case_id", "spark_title", "reveal_title", "series_name")
    search_fields = ("case_id", "spark_title", "reveal_title", "series_name")
    readonly_fields = ("created_at", "updated_at")


