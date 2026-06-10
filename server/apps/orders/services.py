from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from django.core import signing
from django.db import transaction
from django.utils.crypto import constant_time_compare
from rest_framework.exceptions import ValidationError

from apps.products.models import Product

from .models import Order, OrderItem


ZERO = Decimal("0.00")
GUEST_ORDER_ACCESS_TOKEN_SALT = "apps.orders.guest_order_access"


@dataclass(frozen=True)
class CheckoutLine:
    product: Product
    quantity: int
    line_total: Decimal


def build_checkout_summary(*, items: list[dict[str, int]]) -> dict[str, Any]:
    lines, subtotal = _collect_checkout_lines(items=items, lock_products=False)

    return {
        "items": [
            {
                "product": line.product.pk,
                "product_name": line.product.name,
                "product_slug": line.product.slug,
                "unit_price": line.product.price,
                "quantity": line.quantity,
                "line_total": line.line_total,
            }
            for line in lines
        ],
        "subtotal": subtotal,
        "shipping_amount": ZERO,
        "tax_amount": ZERO,
        "discount_amount": ZERO,
        "total_amount": subtotal,
    }


def build_guest_order_access_token(order: Order) -> str:
    return signing.dumps(
        {"order_number": order.order_number, "email": order.email},
        salt=GUEST_ORDER_ACCESS_TOKEN_SALT,
    )


def is_valid_guest_order_access_token(*, order_number: str | None, token: str | None) -> bool:
    if not order_number or not token:
        return False

    try:
        payload = signing.loads(token, salt=GUEST_ORDER_ACCESS_TOKEN_SALT)
    except signing.BadSignature:
        return False

    if not isinstance(payload, dict):
        return False

    signed_order_number = payload.get("order_number")
    return isinstance(signed_order_number, str) and constant_time_compare(signed_order_number, order_number)


@transaction.atomic
def create_checkout_order(
    *,
    user: object | None,
    email: str,
    phone: str,
    shipping_address: dict[str, str],
    items: list[dict[str, int]],
) -> Order:
    lines, subtotal = _collect_checkout_lines(items=items, lock_products=True)

    order = Order.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        email=email,
        phone=phone,
        shipping_address=shipping_address,
        subtotal=ZERO,
        shipping_amount=ZERO,
        tax_amount=ZERO,
        discount_amount=ZERO,
        total_amount=ZERO,
    )

    for line in lines:
        OrderItem.objects.create(
            order=order,
            product=line.product,
            product_name=line.product.name,
            product_slug=line.product.slug,
            unit_price=line.product.price,
            quantity=line.quantity,
            line_total=line.line_total,
        )
        line.product.stock -= line.quantity
        line.product.save(update_fields=["stock", "updated_at"])

    order.subtotal = subtotal
    order.total_amount = subtotal + order.shipping_amount + order.tax_amount - order.discount_amount
    order.save(update_fields=["subtotal", "total_amount", "updated_at"])
    return order


def mark_order_paid(order: Order) -> Order:
    order.status = Order.Status.CONFIRMED
    order.payment_status = Order.PaymentStatus.PAID
    order.save(update_fields=["status", "payment_status", "updated_at"])
    return order


def mark_order_cod_pending(order: Order) -> Order:
    order.status = Order.Status.CONFIRMED
    order.payment_status = Order.PaymentStatus.COD_PENDING
    order.save(update_fields=["status", "payment_status", "updated_at"])
    return order


def mark_order_payment_failed(order: Order) -> Order:
    order.status = Order.Status.FAILED
    order.payment_status = Order.PaymentStatus.FAILED
    order.save(update_fields=["status", "payment_status", "updated_at"])
    return order


def _collect_checkout_lines(*, items: list[dict[str, int]], lock_products: bool) -> tuple[list[CheckoutLine], Decimal]:
    if not items:
        raise ValidationError({"items": ["At least one checkout item is required."]})

    requested_quantities: defaultdict[int, int] = defaultdict(int)
    for item in items:
        requested_quantities[item["product"]] += item["quantity"]

    products_queryset = Product.objects.filter(
        pk__in=requested_quantities.keys(),
        is_active=True,
        category__is_active=True,
    )
    if lock_products:
        products_queryset = products_queryset.select_for_update()

    products = {product.pk: product for product in products_queryset}
    if len(products) != len(requested_quantities):
        raise Product.DoesNotExist

    for product_id, requested_quantity in requested_quantities.items():
        product = products[product_id]
        if product.stock < requested_quantity:
            raise ValidationError({"items": [f"{product.name} does not have enough stock."]})

    lines: list[CheckoutLine] = []
    subtotal = ZERO
    for item in items:
        product = products[item["product"]]
        quantity = item["quantity"]
        line_total = product.price * quantity
        lines.append(CheckoutLine(product=product, quantity=quantity, line_total=line_total))
        subtotal += line_total

    return lines, subtotal
