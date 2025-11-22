from __future__ import annotations

from typing import Any, Dict, List


def build_case_primer(case_id: str) -> Dict[str, Any]:
    """Return patient + stage + available_resources metadata for this case.

    This is intentionally a simple stub for now; it can later be backed by
    database models or a richer case authoring tool.
    """

    # In the future, map different IDs to different structured cases.
    # For now we return a single canonical shortness-of-breath case.
    patient = {
        "age": 67,
        "sex": "male",
        "chief_complaint": "shortness of breath",
        "history": [
            "Hypertension",
            "Type 2 diabetes",
            "Former smoker",
        ],
    }

    available_resources: List[str] = ["chest_xray", "ekg", "basic_labs"]

    return {
        "case_id": case_id,
        "patient": patient,
        "initial_stage": "stage_1",
        "available_resources": available_resources,
    }


