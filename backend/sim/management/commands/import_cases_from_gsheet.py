from __future__ import annotations

import csv
import io
import mimetypes
import os
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import boto3
import requests
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from django.core.management.base import BaseCommand, CommandParser

from sim.models import SimCase, SimResource


# Header names are kept EXACTLY as in the source sheet so the mapping remains
# transparent and easy to reason about.
CASE_ID_COL = "Case_Organization_Case_ID"
SPARK_TITLE_COL = "Case_Organization_Spark_Title"
REVEAL_TITLE_COL = "Case_Organization_Reveal_Title"
SERIES_NAME_COL = "Case_Series_Name"
DIFFICULTY_COL = "Difficulty_Level"

# Simple "ready to import" flags
CONVERSION_STATUS_COL = "Developer_and_QA_Metadata_Conversion_Status"
SEED_TRIGGER_COL = "image sync_Seed_Generation_Trigger"

# Pattern to match media URL columns: Resources_and_Media_Assets_Media_URL 1, 2, etc.
MEDIA_URL_PATTERN = re.compile(r"Resources_and_Media_Assets_Media_URL\s*(\d+)", re.IGNORECASE)


def _extract_sheet_id(url_or_id: str) -> str:
    """Extract Google Sheet ID from URL or return as-is if already an ID."""
    # If it looks like a full URL, extract the ID
    if "docs.google.com" in url_or_id:
        # Pattern: /d/{sheet_id}/
        match = re.search(r"/d/([a-zA-Z0-9_-]+)", url_or_id)
        if match:
            return match.group(1)
    # Otherwise assume it's already an ID
    return url_or_id


def _fetch_sheet_as_csv(sheet_id: str, gid: str = "0") -> str:
    """Fetch a Google Sheet as CSV content."""
    export_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    resp = requests.get(export_url, timeout=60, allow_redirects=True)
    resp.raise_for_status()
    return resp.text


def _is_row_ready(row: Dict[str, Any]) -> bool:
    """Decide if a CSV row should be imported as a case."""
    status = str(row.get(CONVERSION_STATUS_COL) or "").strip().lower()
    trigger = str(row.get(SEED_TRIGGER_COL) or "").strip().lower()

    if status == "converted":
        return True
    if trigger == "case_ready":
        return True

    # Fallback: allow import as long as there is a case_id.
    return bool(str(row.get(CASE_ID_COL) or "").strip())


def _infer_resource_type(url: str) -> str:
    """Infer resource type from URL or file extension."""
    parsed = urlparse(url)
    path = parsed.path.lower()

    if any(ext in path for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"]):
        return "image"
    if ".pdf" in path:
        return "pdf"
    if any(ext in path for ext in [".mp3", ".wav", ".m4a", ".ogg", ".aac"]):
        return "audio"
    if any(ext in path for ext in [".mp4", ".mov", ".avi", ".webm"]):
        return "video"

    # Try mimetypes as fallback
    mime_type, _ = mimetypes.guess_type(url)
    if mime_type:
        if mime_type.startswith("image/"):
            return "image"
        if mime_type.startswith("audio/"):
            return "audio"
        if mime_type.startswith("video/"):
            return "video"
        if mime_type == "application/pdf":
            return "pdf"

    return "unknown"


def _generate_resource_id(url: str, index: int) -> str:
    """Generate a resource ID from URL or use index-based fallback."""
    parsed = urlparse(url)
    path = parsed.path

    if path:
        filename = os.path.basename(path)
        name, _ = os.path.splitext(filename)
        if name and len(name) > 2:
            clean = re.sub(r"[^a-z0-9_-]", "_", name.lower())
            clean = re.sub(r"_+", "_", clean).strip("_")
            if clean:
                return clean

    return f"resource_{index}"


def _get_file_extension(url: str, content_type: Optional[str] = None) -> str:
    """Get file extension from URL or content type."""
    parsed = urlparse(url)
    path = parsed.path.lower()

    if "." in os.path.basename(path):
        ext = os.path.splitext(path)[1]
        if ext:
            return ext

    if content_type:
        ext = mimetypes.guess_extension(content_type.split(";")[0].strip())
        if ext:
            return ext

    return ""


def _extract_media_urls(row: Dict[str, Any]) -> List[tuple]:
    """Extract all media URLs from a CSV row."""
    urls = []
    for key, value in row.items():
        match = MEDIA_URL_PATTERN.match(key)
        if match and value:
            url = str(value).strip()
            if url and url.startswith("http"):
                index = int(match.group(1))
                urls.append((index, url))

    urls.sort(key=lambda x: x[0])
    return urls


class Command(BaseCommand):
    help = "Import simulation cases directly from a Google Sheet."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "sheet_url",
            type=str,
            help="Google Sheet URL or ID (e.g., https://docs.google.com/spreadsheets/d/SHEET_ID/...)",
        )

        parser.add_argument(
            "--gid",
            type=str,
            default="0",
            help="Sheet tab GID (default: 0 for first tab)",
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and log what would be imported without writing to the database.",
        )

        parser.add_argument(
            "--fetch-resources",
            action="store_true",
            help="Download external media URLs and upload to S3.",
        )

    def handle(self, *args, **options) -> None:
        sheet_url = options["sheet_url"]
        gid = options["gid"]
        dry_run: bool = bool(options["dry_run"])
        fetch_resources: bool = bool(options["fetch_resources"])

        # Extract sheet ID
        sheet_id = _extract_sheet_id(sheet_url)
        self.stdout.write(f"Fetching Google Sheet: {sheet_id} (gid={gid})")

        try:
            csv_content = _fetch_sheet_as_csv(sheet_id, gid)
        except requests.RequestException as e:
            self.stderr.write(self.style.ERROR(f"Failed to fetch sheet: {e}"))
            return

        # Get S3 bucket if fetching resources
        bucket_name = ""
        s3_client = None
        if fetch_resources and not dry_run:
            bucket_name = getattr(settings, "ERSIM_ASSETS_BUCKET", "") or os.environ.get(
                "ERSIM_ASSETS_BUCKET", ""
            )
            if not bucket_name:
                self.stderr.write(
                    self.style.ERROR("ERSIM_ASSETS_BUCKET not configured. Cannot fetch resources.")
                )
                return
            s3_client = boto3.client("s3")

        created = 0
        updated = 0
        skipped = 0
        resources_created = 0
        resources_synced = 0

        # Parse CSV from string
        reader = csv.DictReader(io.StringIO(csv_content))
        headers = reader.fieldnames or []
        self.stdout.write(
            self.style.NOTICE(
                f"Found {len(headers)} columns: {', '.join(headers[:10])}"
                + ("..." if len(headers) > 10 else "")
            )
        )

        for idx, row in enumerate(reader, start=2):
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
                self.stdout.write(
                    f"[DRY-RUN] Would import case {case_id!r} "
                    f"(spark_title={spark_title!r})"
                )

                media_urls = _extract_media_urls(row)
                for url_idx, url in media_urls:
                    resource_id = _generate_resource_id(url, url_idx)
                    self.stdout.write(f"  -> Resource: {resource_id} from {url[:80]}...")
                continue

            obj, was_created = SimCase.objects.update_or_create(
                case_id=case_id,
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

            # Process resources if requested
            if fetch_resources:
                media_urls = _extract_media_urls(row)
                for url_idx, url in media_urls:
                    resource_id = _generate_resource_id(url, url_idx)
                    resource_type = _infer_resource_type(url)

                    resource, res_created = SimResource.objects.update_or_create(
                        case=obj,
                        resource_id=resource_id,
                        defaults={
                            "original_url": url,
                            "resource_type": resource_type,
                        },
                    )
                    if res_created:
                        resources_created += 1

                    # Try to fetch and upload if not already synced
                    if not resource.is_synced and s3_client:
                        try:
                            resp = requests.get(url, timeout=30, stream=True)
                            resp.raise_for_status()

                            content_type = resp.headers.get("Content-Type", "")
                            ext = _get_file_extension(url, content_type)

                            s3_key = f"cases/{case_id}/{resource_id}{ext}"

                            s3_client.put_object(
                                Bucket=bucket_name,
                                Key=s3_key,
                                Body=resp.content,
                                ContentType=content_type or "application/octet-stream",
                            )

                            resource.s3_key = s3_key
                            resource.is_synced = True
                            resource.save(update_fields=["s3_key", "is_synced", "updated_at"])
                            resources_synced += 1

                            self.stdout.write(
                                self.style.SUCCESS(f"  Synced {resource_id} -> s3://{bucket_name}/{s3_key}")
                            )
                        except (requests.RequestException, BotoCoreError, ClientError) as e:
                            self.stderr.write(
                                self.style.WARNING(f"  Failed to sync {resource_id}: {e}")
                            )

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Dry-run complete. Skipped {skipped} rows (not ready or no case_id)."
                )
            )
        else:
            msg = f"Import complete. Created {created}, updated {updated}, skipped {skipped} cases."
            if fetch_resources:
                msg += f" Resources: {resources_created} created, {resources_synced} synced to S3."
            self.stdout.write(self.style.SUCCESS(msg))
