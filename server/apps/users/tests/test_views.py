import pytest
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import CustomUser, EmailConfirmationToken


@pytest.fixture(autouse=True)
def clear_cache() -> None:
    cache.clear()


@pytest.mark.django_db
def test_register_returns_201() -> None:
    client = APIClient()

    response = client.post(
        "/api/v1/auth/register/",
        {
            "email": "register@example.com",
            "phone": "+201000000010",
            "password": "Password123",
            "full_name": "Register User",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data == {"message": "Confirmation email sent."}
    assert CustomUser.objects.filter(email="register@example.com").exists()


@pytest.mark.django_db
def test_register_duplicate_email_returns_400() -> None:
    CustomUser.objects.create_user(
        email="duplicate-view@example.com",
        phone="+201000000011",
        password="Password123",
        full_name="Duplicate View",
    )
    client = APIClient()

    response = client.post(
        "/api/v1/auth/register/",
        {
            "email": "duplicate-view@example.com",
            "phone": "+201000000012",
            "password": "Password123",
            "full_name": "Duplicate View Again",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "email" in response.data


@pytest.mark.django_db
def test_confirm_email_valid_token() -> None:
    user = CustomUser.objects.create_user(
        email="confirm-view@example.com",
        phone="+201000000013",
        password="Password123",
        full_name="Confirm View",
    )
    token = EmailConfirmationToken.objects.create(user=user)
    client = APIClient()

    response = client.post(
        "/api/v1/auth/confirm-email/",
        {"token": str(token.token)},
        format="json",
    )
    user.refresh_from_db()

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {"message": "Email confirmed."}
    assert user.status == CustomUser.Status.ACTIVE
    assert user.is_email_confirmed is True
