from __future__ import annotations

from django.conf import settings
from rest_framework.response import Response
from rest_framework_simplejwt.settings import api_settings


def set_auth_cookies(response: Response, *, access: str, refresh: str | None = None) -> None:
    response.set_cookie(
        settings.JWT_ACCESS_COOKIE_NAME,
        access,
        max_age=int(api_settings.ACCESS_TOKEN_LIFETIME.total_seconds()),
        path=settings.JWT_ACCESS_COOKIE_PATH,
        domain=settings.JWT_COOKIE_DOMAIN,
        secure=settings.JWT_COOKIE_SECURE,
        httponly=True,
        samesite=settings.JWT_COOKIE_SAMESITE,
    )

    if refresh is not None:
        response.set_cookie(
            settings.JWT_REFRESH_COOKIE_NAME,
            refresh,
            max_age=int(api_settings.REFRESH_TOKEN_LIFETIME.total_seconds()),
            path=settings.JWT_REFRESH_COOKIE_PATH,
            domain=settings.JWT_COOKIE_DOMAIN,
            secure=settings.JWT_COOKIE_SECURE,
            httponly=True,
            samesite=settings.JWT_COOKIE_SAMESITE,
        )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        settings.JWT_ACCESS_COOKIE_NAME,
        path=settings.JWT_ACCESS_COOKIE_PATH,
        domain=settings.JWT_COOKIE_DOMAIN,
        samesite=settings.JWT_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        path=settings.JWT_REFRESH_COOKIE_PATH,
        domain=settings.JWT_COOKIE_DOMAIN,
        samesite=settings.JWT_COOKIE_SAMESITE,
    )
