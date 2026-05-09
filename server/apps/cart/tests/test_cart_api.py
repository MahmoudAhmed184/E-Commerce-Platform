from __future__ import annotations

from decimal import Decimal

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.cart.models import CartItem
from apps.products.models import Category, Product
from apps.users.models import CustomUser


@pytest.fixture
def user() -> CustomUser:
    return CustomUser.objects.create_user(
        email="cart@example.com",
        phone="+201000000600",
        password="Password123",
        full_name="Cart User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )


@pytest.fixture
def product() -> Product:
    category = Category.objects.create(name="Cart")
    return Product.objects.create(
        category=category,
        name="Cart Product",
        description="Product for cart tests",
        price=Decimal("10.00"),
        stock=5,
        is_active=True,
    )


@pytest.fixture
def client(user: CustomUser) -> APIClient:
    api_client = APIClient()
    api_client.force_authenticate(user=user)
    return api_client


@pytest.mark.django_db
def test_get_cart_creates_empty_cart(client: APIClient) -> None:
    response = client.get("/api/v1/cart/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["items"] == []
    assert response.data["subtotal"] == "0.00"


@pytest.mark.django_db
def test_cart_requires_authentication(product: Product) -> None:
    response = APIClient().post("/api/v1/cart/items/", {"product": product.id, "quantity": 1}, format="json")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_add_update_and_remove_cart_item(client: APIClient, product: Product) -> None:
    add_response = client.post("/api/v1/cart/items/", {"product": product.id, "quantity": 2}, format="json")
    item_id = add_response.data["items"][0]["id"]

    update_response = client.patch(f"/api/v1/cart/items/{item_id}/", {"quantity": 3}, format="json")
    remove_response = client.delete(f"/api/v1/cart/items/{item_id}/")

    assert add_response.status_code == status.HTTP_201_CREATED
    assert add_response.data["subtotal"] == "20.00"
    assert update_response.status_code == status.HTTP_200_OK
    assert update_response.data["items"][0]["quantity"] == 3
    assert update_response.data["subtotal"] == "30.00"
    assert remove_response.status_code == status.HTTP_200_OK
    assert remove_response.data["items"] == []


@pytest.mark.django_db
def test_add_existing_item_increments_quantity(client: APIClient, product: Product) -> None:
    client.post("/api/v1/cart/items/", {"product": product.id, "quantity": 2}, format="json")
    response = client.post("/api/v1/cart/items/", {"product": product.id, "quantity": 2}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert len(response.data["items"]) == 1
    assert response.data["items"][0]["quantity"] == 4


@pytest.mark.django_db
def test_cart_rejects_quantity_above_stock(client: APIClient, product: Product) -> None:
    response = client.post("/api/v1/cart/items/", {"product": product.id, "quantity": 6}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "quantity" in response.data
    assert CartItem.objects.count() == 0


@pytest.mark.django_db
def test_user_cannot_update_another_users_cart_item(product: Product, user: CustomUser) -> None:
    other_user = CustomUser.objects.create_user(
        email="other-cart@example.com",
        phone="+201000000601",
        password="Password123",
        full_name="Other Cart User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )
    owner_client = APIClient()
    owner_client.force_authenticate(user=user)
    add_response = owner_client.post("/api/v1/cart/items/", {"product": product.id, "quantity": 1}, format="json")
    item_id = add_response.data["items"][0]["id"]

    other_client = APIClient()
    other_client.force_authenticate(user=other_user)
    response = other_client.patch(f"/api/v1/cart/items/{item_id}/", {"quantity": 2}, format="json")

    assert response.status_code == status.HTTP_404_NOT_FOUND
