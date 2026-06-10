from __future__ import annotations

from decimal import Decimal

import pytest

from apps.orders import selectors
from apps.orders.models import Order
from apps.users.models import CustomUser


@pytest.fixture
def user() -> CustomUser:
    return CustomUser.objects.create_user(
        email="order-selector@example.com",
        phone="+201000000770",
        password="Password123",
        full_name="Order Selector User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )


@pytest.fixture
def other_user() -> CustomUser:
    return CustomUser.objects.create_user(
        email="other-order-selector@example.com",
        phone="+201000000771",
        password="Password123",
        full_name="Other Order Selector User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )


def make_order(email: str, *, user: CustomUser | None = None) -> Order:
    return Order.objects.create(
        user=user,
        email=email,
        phone="+201000000772",
        shipping_address={
            "line1": "A",
            "city": "B",
            "state": "C",
            "postal_code": "D",
            "country": "E",
        },
        total_amount=Decimal("20.00"),
    )


@pytest.mark.django_db
def test_get_user_orders_excludes_other_and_guest_orders(
    user: CustomUser,
    other_user: CustomUser,
) -> None:
    user_order = make_order("user@example.com", user=user)
    make_order("other@example.com", user=other_user)
    make_order("guest@example.com")

    assert list(selectors.get_user_orders(user)) == [user_order]


@pytest.mark.django_db
def test_get_user_retrievable_orders_can_include_guest_context(
    user: CustomUser,
    other_user: CustomUser,
) -> None:
    user_order = make_order("user@example.com", user=user)
    guest_order = make_order("guest@example.com")
    make_order("other@example.com", user=other_user)

    without_guest = set(selectors.get_user_retrievable_orders(user))
    with_guest = set(selectors.get_user_retrievable_orders(user, include_guest_context=True))

    assert without_guest == {user_order}
    assert with_guest == {user_order, guest_order}


@pytest.mark.django_db
def test_guest_and_empty_order_selectors(user: CustomUser) -> None:
    make_order("user@example.com", user=user)
    guest_order = make_order("guest@example.com")

    assert list(selectors.get_guest_orders()) == [guest_order]
    assert list(selectors.get_no_orders()) == []
