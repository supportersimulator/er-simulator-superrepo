from __future__ import annotations

from django.db import models


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


