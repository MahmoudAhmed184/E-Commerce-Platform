from __future__ import annotations

import uuid
from typing import Any, cast

from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils import timezone
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, CustomUserManager, EmailConfirmationToken
from .selectors import get_user_by_email, get_user_by_phone


class AuthBlockedError(Exception):
    def __init__(self, code: str, detail: str, account_status: str) -> None:
        self.code = code
        self.detail = detail
        self.account_status = account_status
        super().__init__(detail)


@transaction.atomic
def create_user(email: str, phone: str, password: str, full_name: str) -> CustomUser:
    user_manager = cast(CustomUserManager, CustomUser.objects)
    normalized_email = user_manager.normalize_email(email).strip()
    normalized_phone = phone.strip() if phone else None

    if CustomUser.objects.filter(email__iexact=normalized_email).exists():
        raise ValidationError({"email": "A user with this email already exists."})
    if normalized_phone and CustomUser.objects.filter(phone=normalized_phone).exists():
        raise ValidationError({"phone": "A user with this phone already exists."})

    user = user_manager.create_user(
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
    return f"{settings.FRONTEND_BASE_URL}/auth/confirm-email/{token.token}"


def request_password_reset(email: str) -> None:
    user = get_user_by_email(email)

    if user is None or user.deleted_at is not None or user.status == CustomUser.Status.DELETED:
        return

    send_password_reset_email(user)


def send_password_reset_email(user: CustomUser) -> int:
    reset_url = build_password_reset_url(user)
    message = (
        f"Hello {user.full_name},\n\n"
        "We received a request to reset your Stack Commerce password.\n"
        "Open this link to choose a new password:\n"
        f"{reset_url}\n\n"
        "This link expires in one hour. If you did not request a password reset, "
        "you can ignore this email."
    )

    return send_mail(
        subject="Reset your Stack Commerce password",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def build_password_reset_url(user: CustomUser) -> str:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return f"{settings.FRONTEND_BASE_URL}/auth/reset-password/{uid}/{token}"


@transaction.atomic
def reset_password(uid: str, token: str, new_password: str) -> CustomUser:
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = CustomUser.objects.get(pk=user_id)
    except (CustomUser.DoesNotExist, TypeError, ValueError, OverflowError) as exc:
        raise ValidationError({"token": "This password reset link is invalid or expired."}) from exc

    if user.deleted_at is not None or user.status == CustomUser.Status.DELETED:
        raise ValidationError({"token": "This password reset link is invalid or expired."})

    if not default_token_generator.check_token(user, token):
        raise ValidationError({"token": "This password reset link is invalid or expired."})

    validate_password(new_password, user=user)
    user.set_password(new_password)
    user.save(update_fields=["password", "updated_at"])
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
    if token.expires_at and token.expires_at <= timezone.now():
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

    if user.deleted_at is not None or user.status == CustomUser.Status.DELETED:
        raise AuthBlockedError(
            code="account_deleted",
            detail="This account no longer exists.",
            account_status=CustomUser.Status.DELETED,
        )

    if user.status == CustomUser.Status.RESTRICTED:
        raise AuthBlockedError(
            code="account_restricted",
            detail="Your account has been restricted. Contact support.",
            account_status=CustomUser.Status.RESTRICTED,
        )

    if user.status != CustomUser.Status.ACTIVE or not user.is_email_confirmed:
        raise AuthBlockedError(
            code="email_confirmation_required",
            detail="Please confirm your email before logging in.",
            account_status=CustomUser.Status.PENDING,
        )

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


@transaction.atomic
def update_user_profile(
    user: CustomUser,
    *,
    full_name: str | None = None,
    phone: str | None = None,
) -> CustomUser:
    updates: list[str] = []

    if full_name is not None:
        normalized_full_name = full_name.strip()
        if not normalized_full_name:
            raise ValidationError({"full_name": "This field may not be blank."})
        user.full_name = normalized_full_name
        updates.append("full_name")

    if phone is not None:
        normalized_phone = phone.strip() or None
        if normalized_phone and CustomUser.objects.exclude(id=user.id).filter(phone=normalized_phone).exists():
            raise ValidationError({"phone": "A user with this phone already exists."})
        user.phone = normalized_phone
        updates.append("phone")

    if updates:
        user.save(update_fields=[*updates, "updated_at"])

    return user


@transaction.atomic
def change_password(user: CustomUser, current_password: str, new_password: str) -> CustomUser:
    if not user.check_password(current_password):
        raise ValidationError({"current_password": "Current password is incorrect."})

    validate_password(new_password, user=user)
    user.set_password(new_password)
    user.save(update_fields=["password", "updated_at"])
    return user
