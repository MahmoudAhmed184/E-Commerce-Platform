from __future__ import annotations

from decimal import Decimal

import pytest
from django.conf import settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.cart.models import Cart, CartItem
from apps.products.models import Category, Product
from apps.users.models import CustomUser
from apps.users.services import issue_auth_tokens


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


def client_with_access_cookie(user: CustomUser) -> APIClient:
    api_client = APIClient()
    api_client.cookies[settings.JWT_ACCESS_COOKIE_NAME] = issue_auth_tokens(user)["access"]
    return api_client


@pytest.mark.django_db
def test_get_cart_creates_empty_cart(client: APIClient) -> None:
    response = client.get("/api/v1/cart/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == Cart.Status.ACTIVE
    assert response.data["items"] == []
    assert response.data["subtotal"] == "0.00"


@pytest.mark.django_db
def test_cart_requires_authentication(product: Product) -> None:
    response = APIClient().post("/api/v1/cart/items/", {"product": product.id, "quantity": 1}, format="json")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_cart_rechecks_restricted_user_status_from_existing_cookie(user: CustomUser) -> None:
    client = client_with_access_cookie(user)
    user.status = CustomUser.Status.RESTRICTED
    user.save(update_fields=["status", "updated_at"])

    response = client.get("/api/v1/cart/")

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["code"] == "account_restricted"


@pytest.mark.django_db
def test_add_update_and_remove_cart_item(client: APIClient, product: Product) -> None:
    add_response = client.post("/api/v1/cart/items/", {"product": product.id, "quantity": 2}, format="json")
    item_id = add_response.data["items"][0]["id"]

    update_response = client.patch(f"/api/v1/cart/items/{item_id}/", {"quantity": 3}, format="json")
    remove_response = client.delete(f"/api/v1/cart/items/{item_id}/")

    assert add_response.status_code == status.HTTP_201_CREATED
    assert add_response.data["status"] == Cart.Status.ACTIVE
    assert add_response.data["subtotal"] == "20.00"
    assert update_response.status_code == status.HTTP_200_OK
    assert update_response.data["status"] == Cart.Status.ACTIVE
    assert update_response.data["items"][0]["quantity"] == 3
    assert update_response.data["subtotal"] == "30.00"
    assert remove_response.status_code == status.HTTP_200_OK
    assert remove_response.data["status"] == Cart.Status.ACTIVE
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
def test_cart_rejects_product_in_inactive_category(client: APIClient, product: Product) -> None:
    product.category.is_active = False
    product.category.save(update_fields=["is_active", "updated_at"])

    response = client.post("/api/v1/cart/items/", {"product": product.id, "quantity": 1}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "product" in response.data
    assert CartItem.objects.count() == 0


@pytest.mark.django_db
def test_cart_update_rejects_item_after_category_deactivation(client: APIClient, product: Product) -> None:
    add_response = client.post("/api/v1/cart/items/", {"product": product.id, "quantity": 1}, format="json")
    item_id = add_response.data["items"][0]["id"]
    product.category.is_active = False
    product.category.save(update_fields=["is_active", "updated_at"])

    response = client.patch(f"/api/v1/cart/items/{item_id}/", {"quantity": 2}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["product"] == ["This product is no longer available."]


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


@pytest.mark.django_db
def test_get_cart_ignores_converted_cart_and_creates_new_active_cart(client: APIClient, user: CustomUser, product: Product) -> None:
    converted_cart = Cart.objects.create(user=user, status=Cart.Status.CONVERTED)
    CartItem.objects.create(cart=converted_cart, product=product, quantity=2, unit_price_snapshot=product.price)

    response = client.get("/api/v1/cart/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == Cart.Status.ACTIVE
    assert response.data["items"] == []
    assert response.data["id"] != converted_cart.id
    assert Cart.objects.filter(user=user, status=Cart.Status.ACTIVE).count() == 1
    assert CartItem.objects.filter(cart=converted_cart).count() == 1


@pytest.mark.django_db
def test_get_cart_collapses_duplicate_active_carts(client: APIClient, user: CustomUser, product: Product) -> None:
    stale_cart = Cart.objects.create(user=user, status=Cart.Status.ACTIVE)
    current_cart = Cart.objects.create(user=user, status=Cart.Status.ACTIVE)
    CartItem.objects.create(cart=current_cart, product=product, quantity=1, unit_price_snapshot=product.price)

    response = client.get("/api/v1/cart/")

    stale_cart.refresh_from_db()
    current_cart.refresh_from_db()
    assert response.status_code == status.HTTP_200_OK
    assert response.data["id"] == current_cart.id
    assert current_cart.status == Cart.Status.ACTIVE
    assert stale_cart.status == Cart.Status.ABANDONED
    assert Cart.objects.filter(user=user, status=Cart.Status.ACTIVE).count() == 1
