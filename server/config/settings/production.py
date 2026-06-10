import os

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403


DEBUG = False


def _parse_admins(value: str) -> list[tuple[str, str]]:
    admins: list[tuple[str, str]] = []
    for entry in value.split(","):
        if ":" not in entry:
            continue
        name, email = (part.strip() for part in entry.split(":", 1))
        if name and email:
            admins.append((name, email))
    return admins

_production_secret_key = os.environ.get("DJANGO_SECRET_KEY")
if not _production_secret_key:
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set for production settings.")
if (
    len(_production_secret_key) < 50
    or len(set(_production_secret_key)) < 5
    or _production_secret_key.startswith("django-insecure-")
):
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be a strong production secret.")
SECRET_KEY = _production_secret_key

_payment_webhook_secret = os.environ.get("PAYMENT_WEBHOOK_SECRET")
if not _payment_webhook_secret:
    raise ImproperlyConfigured("PAYMENT_WEBHOOK_SECRET must be set for production settings.")
PAYMENT_WEBHOOK_SECRET = _payment_webhook_secret

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
ADMINS = _parse_admins(os.environ.get("DJANGO_ADMINS", ""))
SERVER_EMAIL = os.environ.get("SERVER_EMAIL", DEFAULT_FROM_EMAIL)  # noqa: F405
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
JWT_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

_error_alert_handlers = ["console", *(["mail_admins"] if ADMINS else [])]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "config.logging.JsonFormatter",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
        "mail_admins": {
            "class": "django.utils.log.AdminEmailHandler",
            "level": "ERROR",
            "include_html": False,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
    "loggers": {
        "apps": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "django.request": {
            "handlers": _error_alert_handlers,
            "level": "ERROR",
            "propagate": False,
        },
        "django.security": {
            "handlers": _error_alert_handlers,
            "level": "WARNING",
            "propagate": False,
        },
    },
}
