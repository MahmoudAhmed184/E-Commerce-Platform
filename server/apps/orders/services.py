from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.products.models import Product

from .models import Order, OrderItem


ZERO = Decimal("0.00")


@transaction.atomic
def create_checkout_order(
    *,
    user: object | None,
    email: str,
    phone: str,
    shipping_address: dict[str, str],
    items: list[dict[str, int]],
) -> Order:
    if not items:
        raise ValidationError({"items": ["At least one checkout item is required."]})

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

    subtotal = ZERO
    for item in items:
        product_id = item["product"]
        quantity = item["quantity"]
        product = Product.objects.select_for_update().get(pk=product_id, is_active=True)

        if product.stock < quantity:
            raise ValidationError({"items": [f"{product.name} does not have enough stock."]})

        line_total = product.price * quantity
        OrderItem.objects.create(
            order=order,
            product=product,
            product_name=product.name,
            product_slug=product.slug,
            unit_price=product.price,
            quantity=quantity,
            line_total=line_total,
        )
        product.stock -= quantity
        product.save(update_fields=["stock", "updated_at"])
        subtotal += line_total

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
