from __future__ import annotations

from functools import lru_cache

import redis
from django.conf import settings


@lru_cache(maxsize=1)
def get_redis_client() -> "redis.Redis":
    """Return a cached Redis client based on settings.REDIS_URL."""

    return redis.from_url(settings.REDIS_URL)


def _resource_key(session_id: str, resource: str) -> str:
    return f"sim:{session_id}:resource:{resource}"


def has_resource_been_served(session_id: str, resource: str) -> bool:
    """Return True if the resource has already been served for this session."""

    client = get_redis_client()
    return bool(client.exists(_resource_key(session_id, resource)))


def mark_resource_served(session_id: str, resource: str) -> None:
    """Mark a resource as served for this session.

    A TTL could be added here in the future to expire old sessions.
    """

    client = get_redis_client()
    client.set(_resource_key(session_id, resource), "1")


