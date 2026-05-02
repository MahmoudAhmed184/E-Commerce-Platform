from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Print active auth and API security settings."

    def handle(self, *args: object, **options: object) -> None:
        simple_jwt = getattr(settings, "SIMPLE_JWT", {})
        rest_framework = getattr(settings, "REST_FRAMEWORK", {})

        checklist = {
            "CORS_ALLOWED_ORIGINS": getattr(settings, "CORS_ALLOWED_ORIGINS", []),
            "CORS_MIDDLEWARE_ENABLED": "corsheaders.middleware.CorsMiddleware" in settings.MIDDLEWARE,
            "DEFAULT_PERMISSION_CLASSES": rest_framework.get("DEFAULT_PERMISSION_CLASSES", ()),
            "DEFAULT_THROTTLE_CLASSES": rest_framework.get("DEFAULT_THROTTLE_CLASSES", ()),
            "DEFAULT_THROTTLE_RATES": rest_framework.get("DEFAULT_THROTTLE_RATES", {}),
            "ACCESS_TOKEN_LIFETIME": simple_jwt.get("ACCESS_TOKEN_LIFETIME"),
            "REFRESH_TOKEN_LIFETIME": simple_jwt.get("REFRESH_TOKEN_LIFETIME"),
            "ROTATE_REFRESH_TOKENS": simple_jwt.get("ROTATE_REFRESH_TOKENS"),
            "BLACKLIST_AFTER_ROTATION": simple_jwt.get("BLACKLIST_AFTER_ROTATION"),
            "SECURE_SSL_REDIRECT": getattr(settings, "SECURE_SSL_REDIRECT", False),
            "SESSION_COOKIE_SECURE": getattr(settings, "SESSION_COOKIE_SECURE", False),
            "CSRF_COOKIE_SECURE": getattr(settings, "CSRF_COOKIE_SECURE", False),
            "SECURE_HSTS_SECONDS": getattr(settings, "SECURE_HSTS_SECONDS", 0),
        }

        self.stdout.write("Auth security checklist")
        for key, value in checklist.items():
            self.stdout.write(f"- {key}: {value}")
