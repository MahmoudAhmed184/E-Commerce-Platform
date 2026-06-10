from __future__ import annotations

import hashlib
import hmac
import json
from decimal import Decimal

import pytest
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from apps.cart.models import Cart, CartItem
from apps.orders.models import Order
from apps.payments.models import Payment, Wallet, WalletLedgerEntry
from apps.products.models import Category, Product
from apps.users.models import CustomUser
from apps.users.services import issue_auth_tokens


def set_scoped_throttle_rate(monkeypatch, scope: str, rate: str = "1/minute") -> None:
    monkeypatch.setattr(
        ScopedRateThrottle,
        "THROTTLE_RATES",
        {**ScopedRateThrottle.THROTTLE_RATES, scope: rate},
    )


@pytest.fixture(autouse=True)
def clear_cache() -> None:
    cache.clear()


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


def summary_payload(product: Product) -> dict[str, object]:
    return {"items": [{"product": product.id, "quantity": 2}]}


def client_with_access_cookie(user: CustomUser) -> APIClient:
    client = APIClient()
    client.cookies[settings.JWT_ACCESS_COOKIE_NAME] = issue_auth_tokens(user)["access"]
    return client


@pytest.mark.django_db
def test_checkout_summary_returns_server_totals_without_creating_order(product: Product) -> None:
    client = APIClient()

    response = client.post("/api/v1/orders/summary/", summary_payload(product), format="json")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["subtotal"] == "50.00"
    assert response.data["shipping_amount"] == "0.00"
    assert response.data["tax_amount"] == "0.00"
    assert response.data["discount_amount"] == "0.00"
    assert response.data["total_amount"] == "50.00"
    assert response.data["items"] == [
        {
            "product": product.id,
            "product_name": "Checkout Product",
            "product_slug": "checkout-product",
            "unit_price": "25.00",
            "quantity": 2,
            "line_total": "50.00",
        }
    ]
    product.refresh_from_db()
    assert product.stock == 5
    assert Order.objects.count() == 0
    assert Payment.objects.count() == 0


@pytest.mark.django_db
def test_checkout_summary_rejects_insufficient_aggregate_stock_without_writes(product: Product) -> None:
    client = APIClient()
    payload = {"items": [{"product": product.id, "quantity": 3}, {"product": product.id, "quantity": 3}]}

    response = client.post("/api/v1/orders/summary/", payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["items"] == ["Checkout Product does not have enough stock."]
    product.refresh_from_db()
    assert product.stock == 5
    assert Order.objects.count() == 0
    assert Payment.objects.count() == 0


@pytest.mark.django_db
def test_checkout_summary_rejects_product_in_inactive_category(product: Product) -> None:
    client = APIClient()
    product.category.is_active = False
    product.category.save(update_fields=["is_active", "updated_at"])

    response = client.post("/api/v1/orders/summary/", summary_payload(product), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["items"] == ["One or more products could not be found."]
    product.refresh_from_db()
    assert product.stock == 5
    assert Order.objects.count() == 0
    assert Payment.objects.count() == 0


@pytest.mark.django_db
def test_checkout_summary_rechecks_restricted_user_status_from_existing_cookie(product: Product) -> None:
    user = CustomUser.objects.create_user(
        email="restricted-summary@example.com",
        phone="+201000000508",
        password="Password123",
        full_name="Restricted Summary User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )
    client = client_with_access_cookie(user)
    user.status = CustomUser.Status.RESTRICTED
    user.save(update_fields=["status", "updated_at"])

    response = client.post("/api/v1/orders/summary/", summary_payload(product), format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["code"] == "account_restricted"
    assert Order.objects.count() == 0
    product.refresh_from_db()
    assert product.stock == 5


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
    assert response.data["guest_access_token"]
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
def test_checkout_rejects_product_in_inactive_category_without_decrementing(product: Product) -> None:
    client = APIClient()
    product.category.is_active = False
    product.category.save(update_fields=["is_active", "updated_at"])

    response = client.post("/api/v1/orders/checkout/", checkout_payload(product), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["items"] == ["One or more products could not be found."]
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
def test_payment_webhook_has_scoped_rate_limit(product: Product, monkeypatch) -> None:
    cache.clear()
    set_scoped_throttle_rate(monkeypatch, "payment_webhook")
    client = APIClient()
    checkout_response = client.post("/api/v1/orders/checkout/", checkout_payload(product, "card"), format="json")
    payment = Payment.objects.get(order__order_number=checkout_response.data["order_number"])
    body = json.dumps(
        {
            "event_id": "evt_rate_limit",
            "provider_reference": payment.provider_reference,
            "status": Payment.Status.PAID,
        }
    ).encode("utf-8")

    first_response = client.post(
        "/api/v1/payments/webhooks/sandbox/",
        body,
        content_type="application/json",
        HTTP_X_SANDBOX_SIGNATURE="bad-signature",
    )
    second_response = client.post(
        "/api/v1/payments/webhooks/sandbox/",
        body,
        content_type="application/json",
        HTTP_X_SANDBOX_SIGNATURE="bad-signature",
    )

    assert first_response.status_code == status.HTTP_403_FORBIDDEN
    assert second_response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


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
def test_wallet_checkout_debits_balance_and_marks_order_paid(product: Product) -> None:
    user = CustomUser.objects.create_user(
        email="wallet-success@example.com",
        phone="+201000000509",
        password="Password123",
        full_name="Wallet Success User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )
    wallet = Wallet.objects.create(user=user, balance=Decimal("80.00"))
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post("/api/v1/orders/checkout/", checkout_payload(product, "wallet"), format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["status"] == Order.Status.CONFIRMED
    assert response.data["payment_status"] == Order.PaymentStatus.PAID
    wallet.refresh_from_db()
    assert wallet.balance == Decimal("30.00")
    payment = Payment.objects.get(order__order_number=response.data["order_number"])
    assert payment.status == Payment.Status.PAID
    assert payment.provider_reference.startswith("wallet_")
    ledger_entry = WalletLedgerEntry.objects.get(payment=payment)
    assert ledger_entry.entry_type == WalletLedgerEntry.EntryType.DEBIT
    assert ledger_entry.amount == Decimal("50.00")
    assert ledger_entry.balance_after == Decimal("30.00")


@pytest.mark.django_db
def test_checkout_rechecks_restricted_user_status_from_existing_cookie(product: Product) -> None:
    user = CustomUser.objects.create_user(
        email="restricted-checkout@example.com",
        phone="+201000000506",
        password="Password123",
        full_name="Restricted Checkout User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )
    client = client_with_access_cookie(user)
    user.status = CustomUser.Status.RESTRICTED
    user.save(update_fields=["status", "updated_at"])

    response = client.post("/api/v1/orders/checkout/", checkout_payload(product), format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["code"] == "account_restricted"
    assert Order.objects.count() == 0
    product.refresh_from_db()
    assert product.stock == 5


@pytest.mark.django_db
def test_checkout_rechecks_soft_deleted_user_status_from_existing_cookie(product: Product) -> None:
    user = CustomUser.objects.create_user(
        email="deleted-checkout@example.com",
        phone="+201000000507",
        password="Password123",
        full_name="Deleted Checkout User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )
    client = client_with_access_cookie(user)
    user.status = CustomUser.Status.DELETED
    user.deleted_at = timezone.now()
    user.save(update_fields=["status", "deleted_at", "updated_at"])

    response = client.post("/api/v1/orders/checkout/", checkout_payload(product), format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["code"] == "account_deleted"
    assert Order.objects.count() == 0
    product.refresh_from_db()
    assert product.stock == 5


@pytest.mark.django_db
def test_checkout_has_scoped_rate_limit(product: Product, monkeypatch) -> None:
    cache.clear()
    set_scoped_throttle_rate(monkeypatch, "checkout")
    client = APIClient()
    invalid_payload = checkout_payload(product)
    invalid_payload["items"] = []

    first_response = client.post("/api/v1/orders/checkout/", invalid_payload, format="json")
    second_response = client.post("/api/v1/orders/checkout/", invalid_payload, format="json")

    assert first_response.status_code == status.HTTP_400_BAD_REQUEST
    assert second_response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


@pytest.mark.django_db
def test_authenticated_checkout_converts_active_cart(product: Product) -> None:
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
    assert response.data["guest_access_token"] is None
    cart.refresh_from_db()
    assert cart.status == Cart.Status.CONVERTED
    assert CartItem.objects.filter(cart=cart).count() == 1

    cart_response = client.get("/api/v1/cart/")

    assert cart_response.status_code == status.HTTP_200_OK
    assert cart_response.data["status"] == Cart.Status.ACTIVE
    assert cart_response.data["items"] == []
    assert cart_response.data["id"] != cart.id


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
    assert response.data["count"] == 1
    assert response.data["results"][0]["order_number"] == checkout_response.data["order_number"]
    assert response.data["results"][0]["email"] == "buyer@example.com"
    assert response.data["results"][0]["phone"] == "+201000000500"
    assert response.data["results"][0]["shipping_address"] == checkout_payload(product)["shipping_address"]
    assert response.data["results"][0]["items"][0]["product_name"] == "Checkout Product"


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
def test_guest_order_detail_requires_guest_access_token(product: Product) -> None:
    client = APIClient()
    checkout_response = client.post("/api/v1/orders/checkout/", checkout_payload(product), format="json")
    order_number = checkout_response.data["order_number"]
    guest_access_token = checkout_response.data["guest_access_token"]

    missing_token_response = client.get(f"/api/v1/orders/{order_number}/")
    response = client.get(
        f"/api/v1/orders/{order_number}/",
        {"guest_access_token": guest_access_token},
    )

    assert missing_token_response.status_code == status.HTTP_404_NOT_FOUND
    assert response.status_code == status.HTTP_200_OK
    assert response.data["order_number"] == order_number
    assert response.data["guest_access_token"] is None
    assert response.data["email"] == "buyer@example.com"
    assert response.data["shipping_address"]["country"] == "Egypt"


@pytest.mark.django_db
def test_guest_order_detail_rejects_wrong_guest_access_token(product: Product) -> None:
    client = APIClient()
    first_checkout = client.post("/api/v1/orders/checkout/", checkout_payload(product), format="json")
    second_checkout = client.post("/api/v1/orders/checkout/", checkout_payload(product), format="json")

    response = client.get(
        f"/api/v1/orders/{second_checkout.data['order_number']}/",
        {"guest_access_token": first_checkout.data["guest_access_token"]},
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
