from __future__ import annotations

import logging
from typing import Any, Dict, List

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from sim.ai_bridge import get_sim_ai_response
from sim.cases import build_case_primer
from sim.resources import S3_RESOURCE_MAP, infer_resource_type
from sim.state_store import has_resource_been_served, mark_resource_served


logger = logging.getLogger(__name__)


def _get_session_id_from_payload(data: Dict[str, Any]) -> str:
    from uuid import uuid4

    session_id = str(data.get("session_id") or "").strip()
    if not session_id:
        session_id = uuid4().hex[:32]
    return session_id


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sim_respond_view(request: Request) -> Response:
    """POST /api/sim/respond/

    Input JSON:
      {
        "session_id": "uuid-or-token",
        "case_id": "case_12",
        "utterance": "Clinician's spoken text"
      }
    """

    payload = request.data
    case_id = str(payload.get("case_id") or "").strip()
    utterance = str(payload.get("utterance") or "").strip()

    if not case_id or not utterance:
        return Response(
            {"detail": "Both 'case_id' and 'utterance' are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    session_id = _get_session_id_from_payload(payload)

    case_primer = build_case_primer(case_id)
    available_resources: List[str] = case_primer.get("available_resources", [])

    # TODO: optionally load/store a conversation_history for this session
    conversation_history: List[Dict[str, str]] = []

    try:
        sim_result = get_sim_ai_response(
            doctor_utterance=utterance,
            case_context=case_primer,
            available_resources=available_resources,
            conversation_history=conversation_history,
        )
    except Exception as exc:  # pragma: no cover - network dependent
        logger.exception("Simulation GPT call failed")
        return Response(
            {"detail": f"Simulation error: {exc}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {
            "session_id": session_id,
            "case_id": case_id,
            "speech_output": sim_result.get("speech_output", ""),
            "action_triggers": sim_result.get("action_triggers", []),
            "ui_updates": sim_result.get("ui_updates", {}),
            "advance_patient_state": sim_result.get("advance_patient_state"),
            "update_vitals": sim_result.get("update_vitals"),
            "patient_voice": sim_result.get("patient_voice"),
            "hint": sim_result.get("hint"),
        }
    )


def _get_s3_client():
    return boto3.client("s3")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def trigger_resource_view(request: Request) -> Response:
    """GET /api/trigger-resource/?session_id=...&resource=...

    Returns a presigned S3 URL for the given resource if it has not already
    been served for this session.
    """

    session_id = str(request.query_params.get("session_id") or "").strip()
    resource = str(request.query_params.get("resource") or "").strip()

    if not session_id or not resource:
        return Response(
            {"detail": "Both 'session_id' and 'resource' query params are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if resource not in S3_RESOURCE_MAP:
        return Response(
            {"detail": f"Unknown resource '{resource}'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if has_resource_been_served(session_id, resource):
        return Response(
            {
                "resource": resource,
                "already_served": True,
            }
        )

    bucket_name = getattr(settings, "ERSIM_ASSETS_BUCKET", "") or ""
    if not bucket_name:
        return Response(
            {"detail": "ERSIM_ASSETS_BUCKET is not configured on the server."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    s3_key = S3_RESOURCE_MAP[resource]
    s3 = _get_s3_client()

    try:
        presigned_url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_name, "Key": s3_key},
            ExpiresIn=600,
        )
    except (ClientError, BotoCoreError) as exc:  # pragma: no cover - network dependent
        logger.exception("Failed to generate S3 presigned URL")
        return Response(
            {"detail": f"Error generating resource URL: {exc}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    # Only now mark as served, so we don't block a retry if S3 errors.
    mark_resource_served(session_id, resource)

    return Response(
        {
            "resource": resource,
            "s3_url": presigned_url,
            "resource_type": infer_resource_type(s3_key),
        }
    )


