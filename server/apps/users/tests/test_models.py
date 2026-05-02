from datetime import timedelta

import pytest

from apps.users.models import CustomUser, EmailConfirmationToken
from apps.users.services import soft_delete_user


@pytest.mark.django_db
def test_user_creation_sets_pending_status() -> None:
    user = CustomUser.objects.create_user(
        email="customer@example.com",
        password="Password123",
        full_name="Customer User",
        phone="+201000000001",
    )

    assert user.status == CustomUser.Status.PENDING
    assert user.role == CustomUser.Role.CUSTOMER
    assert user.is_active is True


@pytest.mark.django_db
def test_email_confirmation_token_expires_after_24h() -> None:
    user = CustomUser.objects.create_user(
        email="token@example.com",
        password="Password123",
        full_name="Token User",
        phone="+201000000002",
    )

    token = EmailConfirmationToken.objects.create(user=user)

    assert abs((token.expires_at - token.created_at) - timedelta(hours=24)) < timedelta(seconds=2)


@pytest.mark.django_db
def test_soft_delete_sets_deleted_at() -> None:
    user = CustomUser.objects.create_user(
        email="delete@example.com",
        password="Password123",
        full_name="Delete User",
        phone="+201000000003",
    )

    soft_delete_user(user.id)
    user.refresh_from_db()

    assert user.deleted_at is not None
    assert user.status == CustomUser.Status.DELETED
