from __future__ import annotations

import hashlib
import hmac
import json
from decimal import Decimal

import pytest
from django.conf import settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.cart.models import Cart, CartItem
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.products.models import Category, Product
from apps.users.models import CustomUser


@pytest.fixture
def product() -> Product:
    category = Category.objects.create(name="Checkout")
    return Product.objects.create(
        category=category,
        name="Checkout Product",
        description="Ready for checkout",
        price=Decimal("25.00"),
        stock=5,
        is_active=True,
    )


def checkout_payload(product: Product, payment_method: str = "cod") -> dict[str, object]:
    return {
        "email": "buyer@example.com",
        "phone": "+201000000500",
        "shipping_address": {
            "line1": "123 Test Street",
            "city": "Cairo",
            "state": "Cairo",
            "postal_code": "11511",
            "country": "Egypt",
        },
        "payment_method": payment_method,
        "items": [{"product": product.id, "quantity": 2}],
    }


@pytest.mark.django_db
def test_checkout_cod_creates_confirmed_order_and_payment(product: Product) -> None:
    client = APIClient()

    response = client.post("/api/v1/orders/checkout/", checkout_payload(product), format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["email"] == "buyer@example.com"
    assert response.data["phone"] == "+201000000500"
    assert response.data["shipping_address"]["line1"] == "123 Test Street"
    assert response.data["status"] == Order.Status.CONFIRMED
    assert response.data["payment_status"] == Order.PaymentStatus.COD_PENDING
    assert response.data["total_amount"] == "50.00"
    assert Payment.objects.get(order__order_number=response.data["order_number"]).status == Payment.Status.COD_PENDING
    product.refresh_from_db()
    assert product.stock == 3


@pytest.mark.django_db
def test_checkout_card_creates_pending_sandbox_payment(product: Product) -> None:
    client = APIClient()

    response = client.post("/api/v1/orders/checkout/", checkout_payload(product, "card"), format="json")

    assert response.status_code == status.HTTP_201_CREATED
    payment = Payment.objects.get(order__order_number=response.data["order_number"])
    assert payment.status == Payment.Status.PENDING
    assert payment.provider_reference.startswith("sandbox_")


@pytest.mark.django_db
def test_checkout_rejects_insufficient_stock_without_decrementing(product: Product) -> None:
    client = APIClient()
    payload = checkout_payload(product)
    payload["items"] = [{"product": product.id, "quantity": 6}]

    response = client.post("/api/v1/orders/checkout/", payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    product.refresh_from_db()
    assert product.stock == 5
    assert Order.objects.count() == 0
    assert Payment.objects.count() == 0


@pytest.mark.django_db
def test_payment_webhook_marks_card_order_paid_idempotently(product: Product) -> None:
    client = APIClient()
    checkout_response = client.post("/api/v1/orders/checkout/", checkout_payload(product, "card"), format="json")
    payment = Payment.objects.get(order__order_number=checkout_response.data["order_number"])
    body = json.dumps(
        {
            "event_id": "evt_paid_1",
            "provider_reference": payment.provider_reference,
            "status": Payment.Status.PAID,
        }
    ).encode("utf-8")
    signature = hmac.new(settings.PAYMENT_WEBHOOK_SECRET.encode("utf-8"), body, hashlib.sha256).hexdigest()

    first_response = client.post(
        "/api/v1/payments/webhooks/sandbox/",
        body,
        content_type="application/json",
        HTTP_X_SANDBOX_SIGNATURE=signature,
    )
    second_response = client.post(
        "/api/v1/payments/webhooks/sandbox/",
        body,
        content_type="application/json",
        HTTP_X_SANDBOX_SIGNATURE=signature,
    )

    assert first_response.status_code == status.HTTP_200_OK
    assert first_response.data["processed"] is True
    assert second_response.status_code == status.HTTP_200_OK
    assert second_response.data["processed"] is False
    payment.refresh_from_db()
    payment.order.refresh_from_db()
    assert payment.status == Payment.Status.PAID
    assert payment.order.payment_status == Order.PaymentStatus.PAID


@pytest.mark.django_db
def test_payment_webhook_rejects_invalid_signature(product: Product) -> None:
    client = APIClient()
    checkout_response = client.post("/api/v1/orders/checkout/", checkout_payload(product, "card"), format="json")
    payment = Payment.objects.get(order__order_number=checkout_response.data["order_number"])
    body = json.dumps(
        {
            "event_id": "evt_invalid_signature",
            "provider_reference": payment.provider_reference,
            "status": Payment.Status.PAID,
        }
    ).encode("utf-8")

    response = client.post(
        "/api/v1/payments/webhooks/sandbox/",
        body,
        content_type="application/json",
        HTTP_X_SANDBOX_SIGNATURE="bad-signature",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    payment.refresh_from_db()
    assert payment.status == Payment.Status.PENDING


@pytest.mark.django_db
def test_wallet_checkout_requires_enough_balance(product: Product) -> None:
    user = CustomUser.objects.create_user(
        email="wallet@example.com",
        phone="+201000000501",
        password="Password123",
        full_name="Wallet User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post("/api/v1/orders/checkout/", checkout_payload(product, "wallet"), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "payment_method" in response.data


@pytest.mark.django_db
def test_authenticated_checkout_clears_cart(product: Product) -> None:
    user = CustomUser.objects.create_user(
        email="checkout-cart@example.com",
        phone="+201000000502",
        password="Password123",
        full_name="Checkout Cart User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )
    cart = Cart.objects.create(user=user)
    CartItem.objects.create(cart=cart, product=product, quantity=2, unit_price_snapshot=product.price)
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post("/api/v1/orders/checkout/", checkout_payload(product), format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert CartItem.objects.filter(cart=cart).count() == 0


@pytest.mark.django_db
def test_authenticated_order_list_includes_frontend_required_fields(product: Product) -> None:
    user = CustomUser.objects.create_user(
        email="orders-list@example.com",
        phone="+201000000504",
        password="Password123",
        full_name="Orders List User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )
    client = APIClient()
    client.force_authenticate(user=user)
    checkout_response = client.post("/api/v1/orders/checkout/", checkout_payload(product), format="json")

    response = client.get("/api/v1/orders/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data[0]["order_number"] == checkout_response.data["order_number"]
    assert response.data[0]["email"] == "buyer@example.com"
    assert response.data[0]["phone"] == "+201000000500"
    assert response.data[0]["shipping_address"] == checkout_payload(product)["shipping_address"]
    assert response.data[0]["items"][0]["product_name"] == "Checkout Product"


@pytest.mark.django_db
def test_authenticated_order_detail_is_not_public(product: Product) -> None:
    user = CustomUser.objects.create_user(
        email="private-order@example.com",
        phone="+201000000503",
        password="Password123",
        full_name="Private Order User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )
    auth_client = APIClient()
    auth_client.force_authenticate(user=user)
    checkout_response = auth_client.post("/api/v1/orders/checkout/", checkout_payload(product), format="json")
    order_number = checkout_response.data["order_number"]

    anonymous_response = APIClient().get(f"/api/v1/orders/{order_number}/")
    owner_response = auth_client.get(f"/api/v1/orders/{order_number}/")

    assert anonymous_response.status_code == status.HTTP_404_NOT_FOUND
    assert owner_response.status_code == status.HTTP_200_OK
    assert owner_response.data["email"] == "buyer@example.com"
    assert owner_response.data["shipping_address"]["city"] == "Cairo"


@pytest.mark.django_db
def test_guest_order_detail_can_be_retrieved_by_order_number(product: Product) -> None:
    client = APIClient()
    checkout_response = client.post("/api/v1/orders/checkout/", checkout_payload(product), format="json")
    order_number = checkout_response.data["order_number"]

    response = client.get(f"/api/v1/orders/{order_number}/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["order_number"] == order_number
    assert response.data["email"] == "buyer@example.com"
    assert response.data["shipping_address"]["country"] == "Egypt"
