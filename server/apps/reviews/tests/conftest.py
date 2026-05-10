"""
Shared test fixtures for the reviews app.

WHY conftest.py?
----------------
pytest automatically discovers ``conftest.py`` files and makes their
fixtures available to every test module in the same directory (and
subdirectories).  This avoids duplicating fixture definitions across
``test_services.py``, ``test_selectors.py``, and ``test_reviews_api.py``.
"""
from __future__ import annotations

from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.products.models import Category, Product
from apps.users.models import CustomUser


@pytest.fixture
def category() -> Category:
    """A simple active category for test products."""
    return Category.objects.create(name="Test Category")


@pytest.fixture
def product(category: Category) -> Product:
    """An active, in-stock product available for reviews."""
    return Product.objects.create(
        category=category,
        name="Reviewed Product",
        description="Ready for reviews",
        price=Decimal("15.00"),
        stock=5,
        is_active=True,
    )


@pytest.fixture
def other_product(category: Category) -> Product:
    """A second active product for cross-product test scenarios."""
    return Product.objects.create(
        category=category,
        name="Other Product",
        description="Another product",
        price=Decimal("25.00"),
        stock=3,
        is_active=True,
    )


@pytest.fixture
def user() -> CustomUser:
    """An active, email-confirmed customer who can submit reviews."""
    return CustomUser.objects.create_user(
        email="reviewer@example.com",
        phone="+201000000601",
        password="Password123",
        full_name="Review User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )


@pytest.fixture
def other_user() -> CustomUser:
    """A second customer for ownership / permission tests."""
    return CustomUser.objects.create_user(
        email="other@example.com",
        phone="+201000000602",
        password="Password123",
        full_name="Other User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )


@pytest.fixture
def admin_user() -> CustomUser:
    """An admin user for moderation tests."""
    return CustomUser.objects.create_user(
        email="admin@example.com",
        phone="+201000000603",
        password="Password123",
        full_name="Admin User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
        role=CustomUser.Role.ADMIN,
        is_staff=True,
    )


@pytest.fixture
def api_client() -> APIClient:
    """A DRF test client (not authenticated by default)."""
    return APIClient()


@pytest.fixture
def auth_client(api_client: APIClient, user: CustomUser) -> APIClient:
    """A DRF test client authenticated as ``user``."""
    api_client.force_authenticate(user=user)
    return api_client
