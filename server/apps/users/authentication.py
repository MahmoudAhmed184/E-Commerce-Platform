from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication

if TYPE_CHECKING:
    from rest_framework.request import Request


class CookieJWTAuthentication(JWTAuthentication):
    """Authenticate JWTs from the access-token cookie."""

    def authenticate(self, request: Request):
        raw_token = request.COOKIES.get(settings.JWT_ACCESS_COOKIE_NAME)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
