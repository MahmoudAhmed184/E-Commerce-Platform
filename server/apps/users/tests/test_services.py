from datetime import timedelta

import pytest
from django.core import mail
from django.core.exceptions import ValidationError
from django.test import override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator

from apps.users.models import CustomUser, EmailConfirmationToken
from apps.users.services import (
    change_password,
    confirm_email,
    create_user,
    request_password_reset,
    reset_password,
    update_user_profile,
)


@override_settings(
    DEFAULT_FROM_EMAIL="Stack Commerce <noreply@example.com>",
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_BASE_URL="http://frontend.test",
)
@pytest.mark.django_db
def test_create_user_hashes_password() -> None:
    user = create_user(
        email="hashed@example.com",
        phone="+201000000004",
        password="Password123",
        full_name="Hashed User",
    )

    assert user.password != "Password123"
    assert user.check_password("Password123")
    assert EmailConfirmationToken.objects.filter(user=user).exists()


@override_settings(
    DEFAULT_FROM_EMAIL="Stack Commerce <noreply@example.com>",
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_BASE_URL="http://frontend.test",
)
@pytest.mark.django_db(transaction=True)
def test_create_user_sends_confirmation_email() -> None:
    user = create_user(
        email="mail@example.com",
        phone="+201000000104",
        password="Password123",
        full_name="Mail User",
    )
    token = EmailConfirmationToken.objects.get(user=user)

    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.subject == "Confirm your Stack Commerce email"
    assert message.from_email == "Stack Commerce <noreply@example.com>"
    assert message.to == ["mail@example.com"]
    assert f"http://frontend.test/auth/confirm-email/{token.token}" in message.body


@pytest.mark.django_db
def test_create_user_duplicate_email_raises() -> None:
    create_user(
        email="duplicate@example.com",
        phone="+201000000005",
        password="Password123",
        full_name="Duplicate User",
    )

    with pytest.raises(ValidationError):
        create_user(
            email="duplicate@example.com",
            phone="+201000000006",
            password="Password123",
            full_name="Other User",
        )


@pytest.mark.django_db
def test_confirm_email_activates_user() -> None:
    user = CustomUser.objects.create_user(
        email="confirm@example.com",
        password="Password123",
        full_name="Confirm User",
        phone="+201000000007",
    )
    token = EmailConfirmationToken.objects.create(user=user)

    confirmed_user = confirm_email(token.token)
    token.refresh_from_db()

    assert confirmed_user.id == user.id
    assert confirmed_user.is_email_confirmed is True
    assert confirmed_user.status == CustomUser.Status.ACTIVE
    assert token.is_used is True


@pytest.mark.django_db
def test_confirm_email_expired_token_raises() -> None:
    user = CustomUser.objects.create_user(
        email="expired@example.com",
        password="Password123",
        full_name="Expired User",
        phone="+201000000008",
    )
    token = EmailConfirmationToken.objects.create(user=user)
    token.expires_at = timezone.now() - timedelta(seconds=1)
    token.save(update_fields=["expires_at"])

    with pytest.raises(ValidationError):
        confirm_email(token.token)


@pytest.mark.django_db
def test_confirm_email_used_token_raises() -> None:
    user = CustomUser.objects.create_user(
        email="used@example.com",
        password="Password123",
        full_name="Used User",
        phone="+201000000009",
    )
    token = EmailConfirmationToken.objects.create(user=user, is_used=True)

    with pytest.raises(ValidationError):
        confirm_email(token.token)


@override_settings(
    DEFAULT_FROM_EMAIL="Stack Commerce <noreply@example.com>",
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_BASE_URL="http://frontend.test",
)
@pytest.mark.django_db
def test_request_password_reset_sends_email() -> None:
    user = CustomUser.objects.create_user(
        email="reset-mail@example.com",
        password="Password123",
        full_name="Reset Mail",
        phone="+201000000210",
    )

    request_password_reset(user.email)

    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.subject == "Reset your Stack Commerce password"
    assert message.from_email == "Stack Commerce <noreply@example.com>"
    assert message.to == [user.email]
    assert "http://frontend.test/auth/reset-password/" in message.body


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
@pytest.mark.django_db
def test_request_password_reset_unknown_email_does_not_send() -> None:
    request_password_reset("missing@example.com")

    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_reset_password_changes_password_and_invalidates_token() -> None:
    user = CustomUser.objects.create_user(
        email="reset-success@example.com",
        password="Password123",
        full_name="Reset Success",
        phone="+201000000211",
    )
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    reset_password(uid, token, "ChangedPassword456")
    user.refresh_from_db()

    assert user.check_password("ChangedPassword456")

    with pytest.raises(ValidationError):
        reset_password(uid, token, "AnotherPassword789")


@pytest.mark.django_db
def test_reset_password_rejects_invalid_token() -> None:
    user = CustomUser.objects.create_user(
        email="reset-invalid@example.com",
        password="Password123",
        full_name="Reset Invalid",
        phone="+201000000212",
    )
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    with pytest.raises(ValidationError):
        reset_password(uid, "invalid-token", "ChangedPassword456")


@pytest.mark.django_db
def test_change_password_requires_current_password() -> None:
    user = CustomUser.objects.create_user(
        email="change-password@example.com",
        password="Password123",
        full_name="Change Password",
        phone="+201000000213",
    )

    change_password(user, "Password123", "ChangedPassword456")
    user.refresh_from_db()

    assert user.check_password("ChangedPassword456")
    assert not user.check_password("Password123")


@pytest.mark.django_db
def test_change_password_rejects_wrong_current_password() -> None:
    user = CustomUser.objects.create_user(
        email="change-wrong@example.com",
        password="Password123",
        full_name="Change Wrong",
        phone="+201000000214",
    )

    with pytest.raises(ValidationError):
        change_password(user, "WrongPassword123", "ChangedPassword456")

    user.refresh_from_db()
    assert user.check_password("Password123")


@pytest.mark.django_db
def test_update_user_profile_updates_name_and_phone() -> None:
    user = CustomUser.objects.create_user(
        email="profile-update@example.com",
        password="Password123",
        full_name="Before Name",
        phone="+201000000110",
    )

    update_user_profile(user, full_name="After Name", phone="+201000000111")
    user.refresh_from_db()

    assert user.full_name == "After Name"
    assert user.phone == "+201000000111"


@pytest.mark.django_db
def test_update_user_profile_allows_clearing_phone() -> None:
    user = CustomUser.objects.create_user(
        email="profile-clear@example.com",
        password="Password123",
        full_name="Clear Phone",
        phone="+201000000112",
    )

    update_user_profile(user, phone="")
    user.refresh_from_db()

    assert user.phone is None


@pytest.mark.django_db
def test_update_user_profile_duplicate_phone_raises() -> None:
    CustomUser.objects.create_user(
        email="existing-phone@example.com",
        password="Password123",
        full_name="Existing Phone",
        phone="+201000000113",
    )
    user = CustomUser.objects.create_user(
        email="profile-duplicate@example.com",
        password="Password123",
        full_name="Duplicate Phone",
        phone="+201000000114",
    )

    with pytest.raises(ValidationError):
        update_user_profile(user, phone="+201000000113")
