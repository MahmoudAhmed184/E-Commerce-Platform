"""
Shared test fixtures for the reviews app.

Why a conftest.py?
  pytest automatically discovers conftest.py files and makes their fixtures
  available to all test files in the same directory (and subdirectories).
  This avoids duplicating fixture setup across test_services.py,
  test_selectors.py, and test_reviews_api.py.
"""
from __future__ import annotations

from decimal import Decimal

import pytest

from apps.products.models import Category, Product
from apps.reviews.models import Review
from apps.users.models import CustomUser


@pytest.fixture
def category() -> Category:
    """A reusable product category."""
    return Category.objects.create(name="Electronics", description="Tech products")


@pytest.fixture
def product(category: Category) -> Product:
    """An active, in-stock product ready for reviews."""
    return Product.objects.create(
        category=category,
        name="Reviewed Product",
        description="A product that can be reviewed",
        price=Decimal("29.99"),
        stock=10,
        is_active=True,
    )


@pytest.fixture
def other_product(category: Category) -> Product:
    """A second product for cross-product test scenarios."""
    return Product.objects.create(
        category=category,
        name="Other Product",
        description="Another product",
        price=Decimal("19.99"),
        stock=5,
        is_active=True,
    )


@pytest.fixture
def user() -> CustomUser:
    """An active, email-confirmed customer who can leave reviews."""
    return CustomUser.objects.create_user(
        email="reviewer@example.com",
        phone="+201000000601",
        password="Password123!",
        full_name="Review User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )


@pytest.fixture
def other_user() -> CustomUser:
    """A second user for ownership/permission tests."""
    return CustomUser.objects.create_user(
        email="other@example.com",
        phone="+201000000602",
        password="Password123!",
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
        password="Password123!",
        full_name="Admin User",
        role=CustomUser.Role.ADMIN,
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
        is_staff=True,
    )


@pytest.fixture
def review(user: CustomUser, product: Product) -> Review:
    """A pre-existing visible review for common test scenarios."""
    return Review.objects.create(
        user=user,
        product=product,
        rating=4,
        comment="Great product!",
    )


@pytest.fixture
def user_order(user: CustomUser, product: Product):
    """A confirmed order for the user containing the reviewed product."""
    from apps.orders.models import Order, OrderItem
    order = Order.objects.create(
        user=user,
        email=user.email,
        phone="+201000000601",
        shipping_address={"address": "123 Test St"},
        status=Order.Status.CONFIRMED,
        payment_status=Order.PaymentStatus.PAID,
    )
    OrderItem.objects.create(
        order=order,
        product=product,
        product_name=product.name,
        product_slug=product.slug,
        unit_price=product.price,
        quantity=1,
        line_total=product.price,
    )
    return order
