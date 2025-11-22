from __future__ import annotations

from typing import Dict


S3_RESOURCE_MAP: Dict[str, str] = {
    # Example mapping for an initial shortness-of-breath case.
    "chest_xray": "case_12/chest_xray.png",
    "basic_labs": "case_12/labs_basic.pdf",
    "ekg": "case_12/ekg.png",
}


def infer_resource_type(s3_key: str) -> str:
    """Infer a simple resource_type based on file extension."""

    lower = s3_key.lower()
    if lower.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
        return "image"
    if lower.endswith(".pdf"):
        return "pdf"
    if lower.endswith((".mp4", ".mov", ".webm")):
        return "video"
    return "binary"


