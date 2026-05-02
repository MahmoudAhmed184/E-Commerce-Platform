from __future__ import annotations

import uuid

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from .models import CustomUser, EmailConfirmationToken


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
    EmailConfirmationToken.objects.create(user=user)
    return user


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
