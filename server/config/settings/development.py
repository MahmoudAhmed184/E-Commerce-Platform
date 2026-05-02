from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]

# Development-specific email settings, etc.
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
