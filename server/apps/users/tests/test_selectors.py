from __future__ import annotations

import pytest

from apps.users.models import CustomUser
from apps.users.selectors import get_current_user_data, get_user_by_email, get_user_by_phone


@pytest.fixture
def user() -> CustomUser:
    return CustomUser.objects.create_user(
        email="selector@example.com",
        phone="+201000000810",
        password="Password123",
        full_name="Selector User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )


@pytest.mark.django_db
def test_get_user_by_email_normalizes_case_and_whitespace(user: CustomUser) -> None:
    assert get_user_by_email(" SELECTOR@EXAMPLE.COM ") == user


@pytest.mark.django_db
def test_get_user_by_phone_strips_whitespace(user: CustomUser) -> None:
    assert get_user_by_phone(" +201000000810 ") == user


@pytest.mark.django_db
def test_get_current_user_data_exposes_auth_state(user: CustomUser) -> None:
    data = get_current_user_data(user)

    assert data == {
        "id": user.id,
        "email": "selector@example.com",
        "phone": "+201000000810",
        "full_name": "Selector User",
        "role": CustomUser.Role.CUSTOMER,
        "status": CustomUser.Status.ACTIVE,
        "is_email_confirmed": True,
    }
