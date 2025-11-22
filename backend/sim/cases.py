from __future__ import annotations

import json
from typing import Any, Dict, List

from sim.models import SimCase


def _parse_vitals_json(raw: str | Dict[str, Any] | None) -> Dict[str, Any] | None:
    if not raw:
        return None
    try:
        if isinstance(raw, dict):
            return raw
        return json.loads(str(raw))
    except Exception:
        return None


def _build_state_roadmap(raw_row: Dict[str, Any]) -> Dict[str, Any]:
    """Build a compact vitals roadmap from the SimCase raw_row.

    Uses the existing Monitor_Vital_Signs_* columns as the source of truth.
    """

    state_columns = [
        ("Initial_Vitals", "Monitor_Vital_Signs_Initial_Vitals"),
        ("State1_Vitals", "Monitor_Vital_Signs_State1_Vitals"),
        ("State2_Vitals", "Monitor_Vital_Signs_State2_Vitals"),
        ("State3_Vitals", "Monitor_Vital_Signs_State3_Vitals"),
        ("State4_Vitals", "Monitor_Vital_Signs_State4_Vitals"),
    ]

    states: List[Dict[str, Any]] = []
    current_state_id: str | None = None

    for state_id, col_name in state_columns:
        vitals_raw = raw_row.get(col_name)
        vitals = _parse_vitals_json(vitals_raw)
        if not vitals:
            continue

        if current_state_id is None:
            current_state_id = state_id

        states.append(
            {
                "id": state_id,
                "vitals": vitals,
                # Optional place for human-authored notes later:
                # "clinical_note": raw_row.get(f"Monitor_Vital_Signs_{state_id}_Note", ""),
            }
        )

    return {
        "current_state_id": current_state_id or "",
        "states": states,
        "vitals_format": raw_row.get("Monitor_Vital_Signs_Vitals_Format"),
        "vitals_update_frequency": raw_row.get(
            "Monitor_Vital_Signs_Vitals_Update_Frequency"
        ),
    }


def build_case_primer(case_id: str) -> Dict[str, Any]:
    """Return patient + stage + available_resources + vitals roadmap for this case."""

    try:
        sim_case = SimCase.objects.get(case_id=case_id)
        raw = sim_case.raw_row or {}
    except SimCase.DoesNotExist:
        # Fallback stub if case is not yet imported
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
            "state_roadmap": {
                "current_state_id": "Initial_Vitals",
                "states": [],
            },
        }

    patient = {
        "age": raw.get("Patient_Demographics_and_Clinical_Data_Age"),
        "sex": raw.get("Patient_Demographics_and_Clinical_Data_Gender"),
        "chief_complaint": raw.get(
            "Patient_Demographics_and_Clinical_Data_Presenting_Complaint"
        ),
        "past_medical_history": raw.get(
            "Patient_Demographics_and_Clinical_Data_Past_Medical_History"
        ),
        "current_medications": raw.get(
            "Patient_Demographics_and_Clinical_Data_Current_Medications"
        ),
        "allergies": raw.get("Patient_Demographics_and_Clinical_Data_Allergies"),
        "social_history": raw.get(
            "Patient_Demographics_and_Clinical_Data_Social_History"
        ),
    }

    # For now, available_resources can be refined later to reflect actual SimResource IDs.
    available_resources: List[str] = []

    state_roadmap = _build_state_roadmap(raw)

    return {
        "case_id": case_id,
        "patient": patient,
        "initial_stage": state_roadmap.get("current_state_id") or "Initial_Vitals",
        "available_resources": available_resources,
        "state_roadmap": state_roadmap,
    }
