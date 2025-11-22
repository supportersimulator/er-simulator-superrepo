from __future__ import annotations

from django.db import models


class SimPrompt(models.Model):
    """Store system prompts / configurations for the sim AI.

    This lets us experiment with different prompt wordings and behaviors
    without redeploying code. Only one prompt per `key` should typically
    be marked as active at a time.
    """

    key = models.CharField(
        max_length=64,
        help_text="Logical key, e.g. 'sim_ai_system_prompt'.",
    )
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    system_prompt = models.TextField()
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key", "-created_at"]

    def __str__(self) -> str:  # pragma: no cover - simple repr
        return f"SimPrompt<{self.key}:{self.name}>"


class SimCase(models.Model):
    """Simulation case imported from a canonical CSV row.

    We keep the original header names in `raw_row` so the sheet can evolve
    without losing fidelity. Convenience fields (case_id, titles, etc.) make
    it easy to query and surface cases in the app.
    """

    # From "Case_Organization_Case_ID"
    case_id = models.CharField(max_length=64, unique=True)

    # Convenience fields pulled from well-known columns; all optional.
    spark_title = models.CharField(max_length=255, blank=True)
    reveal_title = models.CharField(max_length=255, blank=True)
    series_name = models.CharField(max_length=255, blank=True)
    difficulty_level = models.CharField(max_length=64, blank=True)

    # The full original row: {header: value} with exact header names.
    raw_row = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["case_id"]

    def __str__(self) -> str:  # pragma: no cover - simple repr
        return f"SimCase<{self.case_id}>"


class SimResource(models.Model):
    """Media resource associated with a simulation case.

    Resources are external media (images, PDFs, audio) that have been
    downloaded from their original URLs and mirrored into our S3 bucket
    for reliable, fast delivery.
    """

    case = models.ForeignKey(
        SimCase,
        on_delete=models.CASCADE,
        related_name="resources",
    )

    # The resource identifier used in action_triggers, e.g. "chest_xray", "ekg_1"
    resource_id = models.CharField(max_length=128)

    # Original external URL from the CSV
    original_url = models.URLField(max_length=1024, blank=True)

    # S3 key where the resource is stored (e.g. "cases/GAST0001/chest_xray.jpg")
    s3_key = models.CharField(max_length=512, blank=True)

    # Resource type inferred from file extension or content
    resource_type = models.CharField(
        max_length=32,
        blank=True,
        help_text="e.g. 'image', 'pdf', 'audio', 'video'",
    )

    # Whether the resource has been successfully fetched and uploaded to S3
    is_synced = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["case", "resource_id"]
        unique_together = [["case", "resource_id"]]

    def __str__(self) -> str:
        return f"SimResource<{self.case.case_id}:{self.resource_id}>"
