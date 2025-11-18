"""Quick manual test for the voice pipeline stub.

Usage (after running Django locally on http://localhost:8000):

    python backend/scripts/test_voice_pipeline.py

This currently calls the stub /api/voice/full endpoint and prints the JSON
response. It does not yet upload real audio.
"""

from __future__ import annotations

import json
from typing import Any

import requests


def main() -> None:
    url = "http://localhost:8000/api/voice/full"
    # For now, send an empty POST; the backend stub ignores the audio payload.
    resp = requests.post(url, headers={"Authorization": "Bearer dev-token"})
    print("Status:", resp.status_code)
    try:
        data: Any = resp.json()
    except Exception:
        print("Non-JSON response:", resp.text)
        return
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
