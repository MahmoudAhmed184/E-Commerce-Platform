from __future__ import annotations

from decimal import Decimal

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.orders.models import Order
from apps.payments.models import Payment
from apps.products.models import Category, Product
from apps.reviews.models import Review
from apps.users.models import CustomUser


@pytest.fixture
def admin_user() -> CustomUser:
    return CustomUser.objects.create_superuser(
        email="admin@example.com",
        password="Password123",
        full_name="Admin User",
    )


@pytest.fixture
def customer() -> CustomUser:
    return CustomUser.objects.create_user(
        email="customer@example.com",
        phone="+201000000701",
        password="Password123",
        full_name="Customer User",
        status=CustomUser.Status.PENDING,
    )


@pytest.fixture
def product() -> Product:
    category = Category.objects.create(name="Admin API")
    return Product.objects.create(
        category=category,
        name="Admin API Product",
        description="Admin API product",
        price=Decimal("30.00"),
        stock=5,
    )


@pytest.mark.django_db
def test_admin_user_actions_return_updated_user(admin_user: CustomUser, customer: CustomUser) -> None:
    client = APIClient()
    client.force_authenticate(user=admin_user)

    approve_response = client.patch(f"/api/v1/admin/users/{customer.id}/approve/")
    restrict_response = client.patch(f"/api/v1/admin/users/{customer.id}/restrict/")
    delete_response = client.delete(f"/api/v1/admin/users/{customer.id}/")

    assert approve_response.status_code == status.HTTP_200_OK
    assert approve_response.data["status"] == CustomUser.Status.ACTIVE
    assert restrict_response.status_code == status.HTTP_200_OK
    assert restrict_response.data["status"] == CustomUser.Status.RESTRICTED
    assert delete_response.status_code == status.HTTP_200_OK
    assert delete_response.data["status"] == CustomUser.Status.DELETED


@pytest.mark.django_db
def test_admin_order_and_payment_lists(admin_user: CustomUser, customer: CustomUser, product: Product) -> None:
    order = Order.objects.create(
        user=customer,
        email=customer.email,
        phone=customer.phone or "",
        shipping_address={"line1": "A", "city": "B", "state": "C", "postal_code": "D", "country": "E"},
        total_amount=Decimal("30.00"),
    )
    Payment.objects.create(order=order, method=Payment.Method.CARD, amount=order.total_amount)
    client = APIClient()
    client.force_authenticate(user=admin_user)

    orders_response = client.get("/api/v1/admin/orders/")
    payments_response = client.get("/api/v1/admin/payments/")

    assert orders_response.status_code == status.HTTP_200_OK
    assert orders_response.data["results"][0]["customer_email"] == customer.email
    assert payments_response.status_code == status.HTTP_200_OK
    assert payments_response.data["results"][0]["order_number"] == order.order_number


@pytest.mark.django_db
def test_admin_can_hide_and_delete_reviews(admin_user: CustomUser, customer: CustomUser, product: Product) -> None:
    review = Review.objects.create(user=customer, product=product, rating=5)
    client = APIClient()
    client.force_authenticate(user=admin_user)

    hide_response = client.patch(f"/api/v1/admin/reviews/{review.id}/hide/")
    delete_response = client.delete(f"/api/v1/admin/reviews/{review.id}/")

    assert hide_response.status_code == status.HTTP_200_OK
    assert hide_response.data["is_visible"] is False
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT
    assert not Review.objects.filter(id=review.id).exists()
