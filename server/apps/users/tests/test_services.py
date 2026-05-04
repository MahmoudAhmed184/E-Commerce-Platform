from datetime import timedelta

import pytest
from django.core import mail
from django.core.exceptions import ValidationError
from django.test import override_settings
from django.utils import timezone

from apps.users.models import CustomUser, EmailConfirmationToken
from apps.users.services import confirm_email, create_user, update_user_profile


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
    assert f"http://frontend.test/auth/confirm-email?token={token.token}" in message.body


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
