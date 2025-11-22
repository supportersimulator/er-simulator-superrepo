from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

import requests

try:
    # Re-use existing model + key helpers for consistency with voice pipeline.
    from ai.reasoning import OPENAI_CHAT_MODEL, _get_openai_chat_api_key  # type: ignore[attr-defined]
except Exception:  # pragma: no cover - guard if internals change
    OPENAI_CHAT_MODEL = os.environ.get("OPENAI_GPT_MODEL", "gpt-4o-mini")

    def _get_openai_chat_api_key() -> str:
        key = os.environ.get("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("OPENAI_API_KEY is not configured.")
        return key

from sim.prompts import get_sim_system_prompt


def _build_sim_messages(
    doctor_utterance: str,
    case_context: Dict[str, Any],
    available_resources: List[str],
    conversation_history: Optional[List[Dict[str, str]]] = None,
) -> List[Dict[str, str]]:
    """Build chat messages for the simulation GPT call."""

    system_prompt = get_sim_system_prompt()

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt.strip()},
        {
            "role": "system",
            "content": json.dumps(
                {
                    "case_context": case_context,
                    "available_resources": available_resources,
                },
                ensure_ascii=False,
            ),
        },
    ]

    if conversation_history:
        messages.extend(conversation_history)

    messages.append(
        {
            "role": "user",
            "content": doctor_utterance,
        }
    )

    return messages


def _safe_extract_json_block(text: str) -> str:
    """Best-effort extraction of a JSON object from a model string response.

    Handles cases where the model adds prose before/after the JSON or wraps it
    in markdown fences.

    >>> _safe_extract_json_block('```json\\n{"speech_output": "hi"}\\n```')
    '{"speech_output": "hi"}'
    >>> _safe_extract_json_block('prefix {"speech_output": "hi"} suffix')
    '{"speech_output": "hi"}'
    """

    text = text.strip()

    # Strip common markdown fences if present.
    if text.startswith("```"):
        # Remove the first line (``` or ```json) and the last ``` line if present.
        lines = text.splitlines()
        if len(lines) >= 2 and lines[0].startswith("```"):
            lines = lines[1:]
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
        text = "\n".join(lines).strip()

    # If it's valid JSON as-is, return.
    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        pass

    # Fallback: take substring from first "{" to last "}".
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = text[start : end + 1]
        try:
            json.loads(candidate)
            return candidate
        except json.JSONDecodeError:
            return candidate

    return text


def _normalize_sim_response(
    raw: Dict[str, Any],
    available_resources: List[str],
) -> Dict[str, Any]:
    """Normalize and validate the parsed GPT JSON.

    - Ensures required keys exist.
    - Filters action_triggers to allowed resources only.
    - Best-effort enforcement that resources appear in speech_output text.

    >>> _normalize_sim_response(
    ...     {
    ...         "speech_output": "I'll order a chest x-ray and basic labs.",
    ...         "action_triggers": [
    ...             {"type": "resource_request", "resource": "chest_xray"},
    ...             {"type": "resource_request", "resource": "basic_labs"},
    ...             {"type": "resource_request", "resource": "ct_head"},
    ...         ],
    ...         "ui_updates": {"note": "testing"},
    ...     },
    ...     ["chest_xray", "basic_labs"],
    ... )["action_triggers"]
    [{'type': 'resource_request', 'resource': 'chest_xray'}, {'type': 'resource_request', 'resource': 'basic_labs'}]
    """

    speech_output = str(raw.get("speech_output") or "").strip()
    ui_updates = raw.get("ui_updates") or {}
    if not isinstance(ui_updates, dict):
        ui_updates = {}

    allowed = set(available_resources)
    triggers_out: List[Dict[str, str]] = []

    raw_triggers = raw.get("action_triggers") or []
    if isinstance(raw_triggers, list):
        lo_speech = speech_output.lower()
        for item in raw_triggers:
            if not isinstance(item, dict):
                continue
            if item.get("type") != "resource_request":
                continue
            resource = str(item.get("resource") or "").strip()
            if not resource or resource not in allowed:
                continue

            # Best-effort enforcement: only keep if we can see a hint of the
            # resource name (or its words) in the speech_output.
            simple_name = resource.replace("_", " ").lower()
            if simple_name not in lo_speech and resource.lower() not in lo_speech:
                # We trust the prompt, but err on the side of not triggering
                # things that are clearly absent from the spoken reply.
                continue

            triggers_out.append({"type": "resource_request", "resource": resource})

    # Optional, pass-through fields from the raw JSON if present.
    advance_patient_state = raw.get("advance_patient_state")
    update_vitals = raw.get("update_vitals")
    patient_voice = raw.get("patient_voice")
    hint = raw.get("hint")

    return {
        "speech_output": speech_output,
        "action_triggers": triggers_out,
        "ui_updates": ui_updates,
        "advance_patient_state": advance_patient_state,
        "update_vitals": update_vitals,
        "patient_voice": patient_voice,
        "hint": hint,
    }


def get_sim_ai_response(
    doctor_utterance: str,
    case_context: Dict[str, Any],
    available_resources: List[str],
    conversation_history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """Call GPT to get a simulation response with dual outputs.

    The return value is always a dict with keys:
      - speech_output: str
      - action_triggers: list[dict]
      - ui_updates: dict

    This function is robust to malformed JSON from the model: it will attempt
    to extract and parse a JSON block, and if that fails it falls back to
    returning the raw text as speech_output with no triggers.

    >>> parsed = _normalize_sim_response(
    ...     {"speech_output": "OK.", "action_triggers": [], "ui_updates": {}},
    ...     ["chest_xray"],
    ... )
    >>> isinstance(parsed["speech_output"], str)
    True
    """

    messages = _build_sim_messages(
        doctor_utterance=doctor_utterance,
        case_context=case_context,
        available_resources=available_resources,
        conversation_history=conversation_history,
    )

    api_key = _get_openai_chat_api_key()

    resp = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": OPENAI_CHAT_MODEL,
            "messages": messages,
            "temperature": 0.3,
        },
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    content = data["choices"][0]["message"]["content"]

    # Robust JSON parsing
    json_text = _safe_extract_json_block(content)
    try:
        raw = json.loads(json_text)
    except json.JSONDecodeError:
        # Fallback: treat the whole content as speech only.
        return {
            "speech_output": content.strip(),
            "action_triggers": [],
            "ui_updates": {
                "note": "Model returned non-JSON response; using raw text only."
            },
        }

    if not isinstance(raw, dict):
        return {
            "speech_output": str(raw),
            "action_triggers": [],
            "ui_updates": {
                "note": "Model returned non-object JSON; using stringified content.",
            },
        }

    return _normalize_sim_response(raw, available_resources)


