from __future__ import annotations

from django.contrib import admin

from sim.models import SimCase, SimPrompt, SimResource


@admin.register(SimPrompt)
class SimPromptAdmin(admin.ModelAdmin):
    list_display = ("key", "name", "is_active", "created_at")
    list_filter = ("key", "is_active")
    search_fields = ("key", "name", "description")
    readonly_fields = ("created_at", "updated_at")


class SimResourceInline(admin.TabularInline):
    model = SimResource
    extra = 0
    readonly_fields = ("created_at", "updated_at", "is_synced")
    fields = ("resource_id", "resource_type", "original_url", "s3_key", "is_synced")


@admin.register(SimCase)
class SimCaseAdmin(admin.ModelAdmin):
    list_display = ("case_id", "spark_title", "reveal_title", "series_name", "difficulty_level")
    list_filter = ("series_name", "difficulty_level")
    search_fields = ("case_id", "spark_title", "reveal_title", "series_name")
    readonly_fields = ("created_at", "updated_at")
    inlines = [SimResourceInline]


@admin.register(SimResource)
class SimResourceAdmin(admin.ModelAdmin):
    list_display = ("resource_id", "case", "resource_type", "is_synced")
    list_filter = ("resource_type", "is_synced")
    search_fields = ("resource_id", "case__case_id", "original_url")
    readonly_fields = ("created_at", "updated_at")


