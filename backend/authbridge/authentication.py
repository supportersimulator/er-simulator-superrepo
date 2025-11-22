import logging
from typing import Optional, Tuple

from django.conf import settings
from django.contrib.auth import get_user_model
from jose import JWTError, jwt
from rest_framework import authentication, exceptions


logger = logging.getLogger(__name__)
User = get_user_model()


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """Supabase JWT authentication for Django REST Framework.

    Verifies JWTs issued by Supabase using the JWT secret from settings.
    Creates or retrieves Django users based on the Supabase user ID (sub claim).
    """

    def authenticate(self, request) -> Optional[Tuple[User, dict]]:
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1]
        if not token:
            raise exceptions.AuthenticationFailed("Invalid Authorization header")

        # Verify and decode the JWT
        payload = self._decode_jwt(token)

        # Get or create user from Supabase sub (user ID)
        user = self._get_or_create_user(payload)

        return user, payload

    def _decode_jwt(self, token: str) -> dict:
        """Decode and verify the Supabase JWT."""
        jwt_secret = getattr(settings, "SUPABASE_JWT_SECRET", None)
        if not jwt_secret:
            raise exceptions.AuthenticationFailed(
                "Supabase JWT secret not configured"
            )

        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            return payload
        except JWTError as e:
            logger.warning(f"JWT verification failed: {e}")
            raise exceptions.AuthenticationFailed(f"Invalid token: {e}")

    def _get_or_create_user(self, payload: dict) -> User:
        """Get or create a Django user from the JWT payload."""
        sub = payload.get("sub")
        if not sub:
            raise exceptions.AuthenticationFailed("Token missing 'sub' claim")

        email = payload.get("email", "")

        # Use the Supabase user ID as the username
        user, created = User.objects.get_or_create(
            username=sub,
            defaults={"email": email},
        )

        # Update email if it changed
        if not created and email and user.email != email:
            user.email = email
            user.save(update_fields=["email"])

        if created:
            logger.info(f"Created new user from Supabase: {sub}")

        return user
