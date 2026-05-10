"""
Shared test fixtures for the admin_api app.

Provides reusable test data for admin operations testing: admin user,
customer, product, order, payment, and review instances.
"""
from __future__ import annotations

from decimal import Decimal

import pytest

from apps.orders.models import Order
from apps.payments.models import Payment
from apps.products.models import Category, Product
from apps.reviews.models import Review
from apps.users.models import CustomUser


@pytest.fixture
def admin_user() -> CustomUser:
    """An admin superuser for admin endpoint testing."""
    return CustomUser.objects.create_superuser(
        email="admin@example.com",
        password="Password123",
        full_name="Admin User",
    )


@pytest.fixture
def pending_customer() -> CustomUser:
    """A customer with pending_approval status — ready to be approved."""
    return CustomUser.objects.create_user(
        email="pending@example.com",
        phone="+201000000701",
        password="Password123",
        full_name="Pending Customer",
        status=CustomUser.Status.PENDING,
    )


@pytest.fixture
def active_customer() -> CustomUser:
    """An active customer — can be restricted or soft-deleted."""
    return CustomUser.objects.create_user(
        email="active@example.com",
        phone="+201000000702",
        password="Password123",
        full_name="Active Customer",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )


@pytest.fixture
def non_admin_user() -> CustomUser:
    """A regular customer for permission-denial testing."""
    return CustomUser.objects.create_user(
        email="regular@example.com",
        phone="+201000000703",
        password="Password123",
        full_name="Regular User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )


@pytest.fixture
def category() -> Category:
    return Category.objects.create(name="Admin Test Category")


@pytest.fixture
def product(category: Category) -> Product:
    return Product.objects.create(
        category=category,
        name="Admin Test Product",
        description="For admin tests",
        price=Decimal("30.00"),
        stock=5,
    )


@pytest.fixture
def order(active_customer: CustomUser) -> Order:
    """An order linked to the active customer."""
    return Order.objects.create(
        user=active_customer,
        email=active_customer.email,
        phone=active_customer.phone or "",
        shipping_address={
            "line1": "123 Main St",
            "city": "Cairo",
            "state": "Cairo",
            "postal_code": "11511",
            "country": "EG",
        },
        total_amount=Decimal("30.00"),
    )


@pytest.fixture
def payment(order: Order) -> Payment:
    """A card payment for the test order."""
    return Payment.objects.create(
        order=order,
        method=Payment.Method.CARD,
        amount=order.total_amount,
    )


@pytest.fixture
def review(active_customer: CustomUser, product: Product) -> Review:
    """A visible review for moderation testing."""
    return Review.objects.create(
        user=active_customer,
        product=product,
        rating=5,
        comment="Great product!",
    )
