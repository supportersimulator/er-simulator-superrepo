from __future__ import annotations

import json
import os
from typing import Any, Dict, List

import requests


VOICE_REASONING_SCHEMA = {
    "assistant_text": str,
    "clinical_intent": str,
    "vitals_effect": dict,
    "next_step": str,
}

OPENAI_CHAT_MODEL = os.environ.get("OPENAI_GPT_MODEL", "gpt-4o-mini")

SYSTEM_PROMPT = """
You are the voice engine for an Emergency Department simulation.

Your job is to respond to the learner's transcript as a clinically realistic
ED environment (patient, nurse, consultant, monitor), and to return a JSON
object with this EXACT shape:

{
  "assistant_text": "What the AI says",
  "clinical_intent": "question | command | explain | reassurance | escalation",
  "vitals_effect": {
    "hr": "+5",
    "bp": "-10",
    "spo2": "-2",
    "mental_status": "worsening"
  },
  "next_step": "suggested follow-up"
}

Rules:
- assistant_text: what will be spoken aloud and shown on screen.
- clinical_intent: pick ONE of: question, command, explain, reassurance, escalation.
- vitals_effect: relative changes (e.g. "+5", "-10") for hr/bp/spo2, and a descriptor
  ("improving", "stable", "worsening") for mental_status.
- next_step: concise suggestion of what the learner should do next.

Respond with JSON ONLY. No markdown, no extra commentary.
"""


def _get_openai_chat_api_key() -> str:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not configured.")
    return key


def build_reasoning_gpt(
    transcript: str,
    session_context: List[Dict[str, Any]] | None,
) -> Dict[str, Any]:
    """Use GPT to produce Voice Reasoning JSON from transcript + context.

    session_context: list of chat-style dicts like
      {"role": "user"|"assistant", "content": "..."}
    """

    api_key = _get_openai_chat_api_key()

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT.strip()},
    ]

    if session_context:
        messages.extend(session_context)

    messages.append(
        {
            "role": "user",
            "content": f"Learner transcript:\n{transcript}",
        }
    )

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

    try:
        reasoning = json.loads(content)
    except json.JSONDecodeError as exc:  # pragma: no cover - network dependent
        raise RuntimeError(f"GPT reasoning JSON parse error: {exc}") from exc

    assistant_text = reasoning.get("assistant_text", "")

    return {
        "assistant_text": assistant_text,
        "reasoning": reasoning,
    }


def build_stub_reasoning() -> Dict[str, Any]:
    """Fallback stub used only if GPT is unavailable.

    Kept for manual testing or offline development.
    """

    return {
        "assistant_text": "Okay, tell me his current blood pressure and oxygen saturation.",
        "clinical_intent": "question",
        "vitals_effect": {
            "hr": "+5",
            "bp": "-10",
            "spo2": "-2",
            "mental_status": "worsening",
        },
        "next_step": "Ask for vital signs and consider escalation if unstable.",
    }
