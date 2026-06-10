from __future__ import annotations

from decimal import Decimal

import pytest

from apps.admin_api import selectors
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.products.models import Category, Product
from apps.reviews.models import Review
from apps.users.models import CustomUser


@pytest.fixture
def user() -> CustomUser:
    return CustomUser.objects.create_user(
        email="selector-user@example.com",
        phone="+201000000760",
        password="Password123",
        full_name="Selector User",
    )


@pytest.fixture
def product() -> Product:
    category = Category.objects.create(name="Admin Selector")
    return Product.objects.create(
        category=category,
        name="Admin Selector Product",
        description="Product for selector tests",
        price=Decimal("35.00"),
        stock=4,
    )


@pytest.mark.django_db
def test_get_admin_users_applies_search(user: CustomUser) -> None:
    CustomUser.objects.create_user(
        email="unrelated-admin-search@example.com",
        phone="+201000000761",
        password="Password123",
        full_name="Other User",
    )

    users = list(selectors.get_admin_users("selector-user@example.com"))

    assert users == [user]


@pytest.mark.django_db
def test_admin_selectors_preload_operational_lists(
    user: CustomUser,
    product: Product,
) -> None:
    order = Order.objects.create(
        user=user,
        email=user.email,
        phone=user.phone or "",
        shipping_address={
            "line1": "A",
            "city": "B",
            "state": "C",
            "postal_code": "D",
            "country": "E",
        },
        total_amount=Decimal("35.00"),
    )
    payment = Payment.objects.create(
        order=order,
        method=Payment.Method.COD,
        amount=order.total_amount,
    )
    review = Review.objects.create(user=user, product=product, rating=5)

    assert list(selectors.get_admin_orders()) == [order]
    assert list(selectors.get_admin_payments()) == [payment]
    assert list(selectors.get_admin_reviews()) == [review]
