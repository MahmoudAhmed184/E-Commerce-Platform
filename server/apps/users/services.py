from __future__ import annotations

import uuid
from typing import Any, cast
from urllib.parse import urlencode

from django.core.exceptions import PermissionDenied, ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, EmailConfirmationToken
from .selectors import get_user_by_email, get_user_by_phone


@transaction.atomic
def create_user(email: str, phone: str | None, password: str, full_name: str) -> CustomUser:
    normalized_email = CustomUser.objects.normalize_email(email).strip()
    normalized_phone = phone.strip() if phone else None

    if CustomUser.objects.filter(email__iexact=normalized_email).exists():
        raise ValidationError({"email": "A user with this email already exists."})
    if normalized_phone and CustomUser.objects.filter(phone=normalized_phone).exists():
        raise ValidationError({"phone": "A user with this phone already exists."})

    user = CustomUser.objects.create_user(
        email=normalized_email,
        phone=normalized_phone,
        password=password,
        full_name=full_name,
    )
    token = EmailConfirmationToken.objects.create(user=user)
    transaction.on_commit(lambda: send_confirmation_email(user, token))
    return user


def send_confirmation_email(user: CustomUser, token: EmailConfirmationToken) -> int:
    confirmation_url = build_confirmation_url(token)
    message = (
        f"Hello {user.full_name},\n\n"
        "Confirm your Stack Commerce account by opening this link:\n"
        f"{confirmation_url}\n\n"
        "If you did not create this account, you can ignore this email."
    )

    return send_mail(
        subject="Confirm your Stack Commerce email",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def build_confirmation_url(token: EmailConfirmationToken) -> str:
    query = urlencode({"token": str(token.token)})
    return f"{settings.FRONTEND_BASE_URL}/auth/confirm-email?{query}"


@transaction.atomic
def confirm_email(token_uuid: uuid.UUID | str) -> CustomUser:
    try:
        parsed_token = uuid.UUID(str(token_uuid))
    except ValueError as exc:
        raise ValidationError({"token": "Invalid confirmation token."}) from exc

    try:
        token = EmailConfirmationToken.objects.select_related("user").get(token=parsed_token)
    except EmailConfirmationToken.DoesNotExist as exc:
        raise ValidationError({"token": "Invalid confirmation token."}) from exc

    if token.is_used:
        raise ValidationError({"token": "Confirmation token has already been used."})
    if token.expires_at <= timezone.now():
        raise ValidationError({"token": "Confirmation token has expired."})

    user = token.user
    user.is_email_confirmed = True
    user.status = CustomUser.Status.ACTIVE
    user.save(update_fields=["is_email_confirmed", "status", "updated_at"])

    token.is_used = True
    token.save(update_fields=["is_used"])
    return user


@transaction.atomic
def soft_delete_user(user_id: uuid.UUID | str) -> None:
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist as exc:
        raise ValidationError({"user_id": "User does not exist."}) from exc

    user.deleted_at = timezone.now()
    user.status = CustomUser.Status.DELETED
    user.save(update_fields=["deleted_at", "status", "updated_at"])


def authenticate_user(identifier: str, password: str) -> CustomUser:
    normalized_identifier = identifier.strip()
    user = (
        get_user_by_email(normalized_identifier)
        if "@" in normalized_identifier
        else get_user_by_phone(normalized_identifier)
    )

    if user is None or not user.check_password(password):
        raise ValidationError({"non_field_errors": "Invalid credentials."})

    if user.status != CustomUser.Status.ACTIVE or not user.is_email_confirmed or user.deleted_at is not None:
        raise PermissionDenied("Account is not active.")

    return user


def issue_auth_tokens(user: CustomUser) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def blacklist_refresh_token(refresh_token: str) -> None:
    try:
        RefreshToken(cast(Any, refresh_token)).blacklist()
    except TokenError as exc:
        raise ValidationError({"refresh": "Invalid refresh token."}) from exc
