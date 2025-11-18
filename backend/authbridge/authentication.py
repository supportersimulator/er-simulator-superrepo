from typing import Optional, Tuple

from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions


User = get_user_model()


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """Stub Supabase JWT authentication.

    TODO: Implement full JWT verification using python-jose and Supabase keys.
    For now, this accepts all requests as anonymous or a dummy user to enable early
    development of the voice pipeline.
    """

    def authenticate(self, request) -> Optional[Tuple[User, None]]:  # type: ignore[override]
        # TODO: Replace with real JWT parsing and verification.
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1]
        if not token:
            raise exceptions.AuthenticationFailed("Invalid Authorization header")

        # For now, create/get a single shared dev user.
        user, _ = User.objects.get_or_create(username="dev-user")
        return user, None
