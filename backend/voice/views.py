import base64
import logging
import os
import uuid
from typing import Any, Dict, List

import requests
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from ai.reasoning import build_reasoning_gpt
from sessions.models import ConversationTurn


logger = logging.getLogger(__name__)


def _get_openai_api_key() -> str:
    key = os.environ.get("WHISPER_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OpenAI/Whisper API key is not configured.")
    return key


def transcribe_audio_file(uploaded_file) -> Dict[str, Any]:
    """Call OpenAI Whisper on the uploaded file and return transcript metadata.

    Returns a dict: { 'transcript': str, 'language': str | None, 'duration_sec': float | None }
    """

    api_key = _get_openai_api_key()
    url = "https://api.openai.com/v1/audio/transcriptions"

    file_name = getattr(uploaded_file, "name", "audio.m4a")
    content_type = getattr(uploaded_file, "content_type", "application/octet-stream")

    files = {
        "file": (file_name, uploaded_file.read(), content_type),
    }
    data = {
        "model": "whisper-1",
        "response_format": "json",
    }

    resp = requests.post(
        url,
        headers={"Authorization": f"Bearer {api_key}"},
        files=files,
        data=data,
        timeout=60,
    )
    resp.raise_for_status()
    payload = resp.json()
    transcript = payload.get("text", "").strip()

    return {
        "transcript": transcript,
        "language": payload.get("language"),
        "duration_sec": None,  # TODO: derive from metadata if needed
    }


def _get_elevenlabs_api_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        raise RuntimeError("ELEVENLABS_API_KEY is not configured.")
    return key


def synthesize_speech_elevenlabs(text: str) -> str:
    """Call ElevenLabs TTS and return base64-encoded audio bytes."""

    api_key = _get_elevenlabs_api_key()
    # Default voice/ model can be overridden via env
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    headers = {
        "xi-api-key": api_key,
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": os.environ.get(
            "ELEVENLABS_MODEL_ID", "eleven_multilingual_v2"
        ),
    }

    resp = requests.post(url, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    audio_bytes = resp.content
    return base64.b64encode(audio_bytes).decode("utf-8")


def _get_or_create_session_id(request: Request) -> str:
    session_id = request.data.get("session_id") or request.query_params.get("session_id")
    if not session_id:
        session_id = uuid.uuid4().hex[:32]
    return session_id


def _load_session_context(user, session_id: str, max_turns: int = 10) -> List[Dict[str, str]]:
    """Load recent conversation turns as chat-style context for GPT."""

    qs = (
        ConversationTurn.objects.filter(user=user, session_id=session_id)
        .order_by("turn_index")
    )
    turns = list(qs)[-max_turns:]
    context: List[Dict[str, str]] = []
    for t in turns:
        context.append({"role": "user", "content": t.transcript})
        assistant_text = t.reasoning_json.get("assistant_text") or ""
        if assistant_text:
            context.append({"role": "assistant", "content": assistant_text})
    return context


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transcribe_view(request: Request) -> Response:
    """POST /api/voice/transcribe

    Accepts multipart/form-data with an "audio" file and calls OpenAI Whisper.
    """

    uploaded = request.FILES.get("audio")
    if not uploaded:
        return Response(
            {"detail": "Missing 'audio' file in request."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        result = transcribe_audio_file(uploaded)
    except Exception as exc:  # pragma: no cover - network dependent
        logger.exception("Whisper transcription failed")
        return Response(
            {"detail": f"Transcription error: {exc}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {
            "transcript": result["transcript"],
            "language": result.get("language"),
            "duration_sec": result.get("duration_sec"),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def respond_view(request: Request) -> Response:
    """POST /api/voice/respond

    Input JSON:
      { "transcript": "...", "session_id"?: "..." }

    Uses GPT to generate Voice Reasoning JSON and saves the turn.
    """

    transcript = request.data.get("transcript", "").strip()
    if not transcript:
        return Response(
            {"detail": "Missing 'transcript' in request body."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = request.user
    session_id = _get_or_create_session_id(request)
    context = _load_session_context(user, session_id)

    try:
        result = build_reasoning_gpt(transcript, context)
    except Exception as exc:  # pragma: no cover - network dependent
        logger.exception("GPT reasoning failed")
        return Response(
            {"detail": f"Reasoning error: {exc}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    assistant_text = result["assistant_text"]
    reasoning = result["reasoning"]

    last_turn = (
        ConversationTurn.objects.filter(user=user, session_id=session_id)
        .order_by("-turn_index")
        .first()
    )
    next_index = (last_turn.turn_index + 1) if last_turn else 0

    ConversationTurn.objects.create(
        user=user,
        session_id=session_id,
        turn_index=next_index,
        transcript=transcript,
        reasoning_json=reasoning,
    )

    return Response(
        {
            "reasoning": reasoning,
            "assistant_text": assistant_text,
            "session_id": session_id,
            "turn_id": next_index,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def speak_view(request: Request) -> Response:
    """POST /api/voice/speak

    Input JSON:
      { "assistant_text": "..." }

    Returns speech audio as base64 along with the text.
    """

    assistant_text = request.data.get("assistant_text", "").strip()
    if not assistant_text:
        return Response(
            {"detail": "Missing 'assistant_text' in request body."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        audio_base64 = synthesize_speech_elevenlabs(assistant_text)
    except Exception as exc:  # pragma: no cover - network dependent
        logger.exception("ElevenLabs synthesis failed")
        return Response(
            {"detail": f"TTS error: {exc}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {
            "audio_base64": audio_base64,
            "format": "mp3",
            "assistant_text": assistant_text,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def full_pipeline_view(request: Request) -> Response:
    """POST /api/voice/full

    Pipeline: audio → Whisper → GPT → ElevenLabs → JSON payload.
    """

    uploaded = request.FILES.get("audio")
    if not uploaded:
        return Response(
            {"detail": "Missing 'audio' file in request."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        transcription = transcribe_audio_file(uploaded)
    except Exception as exc:  # pragma: no cover - network dependent
        logger.exception("Whisper transcription failed in full pipeline")
        return Response(
            {"detail": f"Transcription error: {exc}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    transcript = transcription["transcript"]
    user = request.user
    session_id = _get_or_create_session_id(request)
    context = _load_session_context(user, session_id)

    try:
        reasoning_result = build_reasoning_gpt(transcript, context)
    except Exception as exc:  # pragma: no cover - network dependent
        logger.exception("GPT reasoning failed in full pipeline")
        return Response(
            {"detail": f"Reasoning error: {exc}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    assistant_text = reasoning_result["assistant_text"]
    reasoning = reasoning_result["reasoning"]

    try:
        audio_base64 = synthesize_speech_elevenlabs(assistant_text)
    except Exception as exc:  # pragma: no cover - network dependent
        logger.exception("ElevenLabs synthesis failed in full pipeline")
        return Response(
            {"detail": f"TTS error: {exc}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    last_turn = (
        ConversationTurn.objects.filter(user=user, session_id=session_id)
        .order_by("-turn_index")
        .first()
    )
    next_index = (last_turn.turn_index + 1) if last_turn else 0

    ConversationTurn.objects.create(
        user=user,
        session_id=session_id,
        turn_index=next_index,
        transcript=transcript,
        reasoning_json=reasoning,
    )

    return Response(
        {
            "transcript": transcript,
            "reasoning": reasoning,
            "assistant_text": assistant_text,
            "audio_base64": audio_base64,
            "session_id": session_id,
            "turn_id": next_index,
        }
    )
