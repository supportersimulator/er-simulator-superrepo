from __future__ import annotations

import csv
from pathlib import Path
from typing import Any, Dict

from django.core.management.base import BaseCommand, CommandParser

from sim.models import SimCase


# Header names are kept EXACTLY as in the source sheet so the mapping remains
# transparent and easy to reason about.
CASE_ID_COL = "Case_Organization_Case_ID"
SPARK_TITLE_COL = "Case_Organization_Spark_Title"
REVEAL_TITLE_COL = "Case_Organization_Reveal_Title"
SERIES_NAME_COL = "Case_Series_Name"
DIFFICULTY_COL = "Difficulty_Level"

# Simple "ready to import" flags – you can adjust these later if your workflow
# changes, but they are kept as literal header strings.
CONVERSION_STATUS_COL = "Developer_and_QA_Metadata_Conversion_Status"
SEED_TRIGGER_COL = "image sync_Seed_Generation_Trigger"


def _is_row_ready(row: Dict[str, Any]) -> bool:
    """Decide if a CSV row should be imported as a case.

    Current logic:
      - If Conversion_Status is present and equals 'Converted' (case-insensitive) -> ready.
      - Else if Seed_Generation_Trigger equals 'case_ready' -> ready.
      - Else import anyway if CASE_ID is non-empty (for flexibility).
    """

    status = str(row.get(CONVERSION_STATUS_COL) or "").strip().lower()
    trigger = str(row.get(SEED_TRIGGER_COL) or "").strip().lower()

    if status == "converted":
        return True
    if trigger == "case_ready":
        return True

    # Fallback: allow import as long as there is a case_id.
    return bool(str(row.get(CASE_ID_COL) or "").strip())


class Command(BaseCommand):
    help = "Import simulation cases from a CSV file where each row is one case."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "csv_path",
            type=str,
            help="Path to the CSV file exported from the case spreadsheet.",
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and log what would be imported without writing to the database.",
        )

    def handle(self, *args, **options) -> None:
        csv_path = Path(options["csv_path"])
        dry_run: bool = bool(options["dry_run"])

        if not csv_path.exists():
            self.stderr.write(self.style.ERROR(f"CSV file not found: {csv_path}"))
            return

        created = 0
        updated = 0
        skipped = 0

        with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []
            self.stdout.write(
                self.style.NOTICE(
                    f"Found {len(headers)} columns: {', '.join(headers[:10])}"
                    + ("..." if len(headers) > 10 else "")
                )
            )

            for idx, row in enumerate(reader, start=2):  # data rows start at line 2
                case_id = str(row.get(CASE_ID_COL) or "").strip()

                if not case_id:
                    skipped += 1
                    continue

                if not _is_row_ready(row):
                    skipped += 1
                    continue

                spark_title = str(row.get(SPARK_TITLE_COL) or "").strip()
                reveal_title = str(row.get(REVEAL_TITLE_COL) or "").strip()
                series_name = str(row.get(SERIES_NAME_COL) or "").strip()
                difficulty = str(row.get(DIFFICULTY_COL) or "").strip()

                defaults = {
                    "spark_title": spark_title,
                    "reveal_title": reveal_title,
                    "series_name": series_name,
                    "difficulty_level": difficulty,
                    "raw_row": row,
                }

                if dry_run:
                    # In dry-run mode we just log.
                    self.stdout.write(
                        f"[DRY-RUN] Would import case {case_id!r} "
                        f"(spark_title={spark_title!r})"
                    )
                    continue

                obj, was_created = SimCase.objects.update_or_create(
                    case_id=case_id,
                    defaults=defaults,
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Dry-run complete. Skipped {skipped} rows (not ready or no case_id)."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Import complete. Created {created}, updated {updated}, "
                    f"skipped {skipped} rows."
                )
            )


