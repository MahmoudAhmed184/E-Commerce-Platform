from __future__ import annotations

import uuid
from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.orders import services as order_services
from apps.orders.models import Order

from .models import Payment, PaymentWebhookEvent, Wallet, WalletLedgerEntry


@transaction.atomic
def create_payment_for_order(
    *,
    order: Order,
    method: str,
    user: object | None,
    idempotency_key: str | None = None,
) -> Payment:
    payment = Payment.objects.create(
        order=order,
        method=method,
        amount=order.total_amount,
        idempotency_key=idempotency_key or None,
    )

    if method == Payment.Method.COD:
        payment.status = Payment.Status.COD_PENDING
        payment.save(update_fields=["status", "updated_at"])
        order_services.mark_order_cod_pending(order)
        return payment

    if method == Payment.Method.WALLET:
        debit_wallet(user=user, payment=payment, amount=order.total_amount)
        payment.status = Payment.Status.PAID
        payment.provider_reference = f"wallet_{uuid.uuid4().hex}"
        payment.save(update_fields=["status", "provider_reference", "updated_at"])
        order_services.mark_order_paid(order)
        return payment

    if method == Payment.Method.CARD:
        payment.provider_reference = f"sandbox_{uuid.uuid4().hex}"
        payment.status = Payment.Status.PENDING
        payment.save(update_fields=["provider_reference", "status", "updated_at"])
        return payment

    raise ValidationError({"payment_method": ["Unsupported payment method."]})


@transaction.atomic
def debit_wallet(*, user: object | None, payment: Payment, amount: Decimal) -> Wallet:
    if not getattr(user, "is_authenticated", False):
        raise ValidationError({"payment_method": ["Wallet payments require an authenticated user."]})

    wallet, _ = Wallet.objects.select_for_update().get_or_create(user=user)
    if wallet.balance < amount:
        raise ValidationError({"payment_method": ["Insufficient wallet balance."]})

    wallet.balance -= amount
    wallet.save(update_fields=["balance", "updated_at"])
    WalletLedgerEntry.objects.create(
        wallet=wallet,
        payment=payment,
        entry_type=WalletLedgerEntry.EntryType.DEBIT,
        amount=amount,
        balance_after=wallet.balance,
        note=f"Payment for order {payment.order.order_number}",
    )
    return wallet


@transaction.atomic
def apply_provider_webhook(
    *,
    event_id: str,
    provider_reference: str,
    status: str,
    payload: dict[str, object],
) -> tuple[Payment, bool]:
    event, created = PaymentWebhookEvent.objects.get_or_create(
        event_id=event_id,
        defaults={
            "provider_reference": provider_reference,
            "status": status,
            "payload": payload,
        },
    )
    payment = Payment.objects.select_related("order").get(provider_reference=provider_reference)

    if not created:
        return payment, False

    if status == Payment.Status.PAID:
        payment.status = Payment.Status.PAID
        payment.provider_payload = payload
        payment.save(update_fields=["status", "provider_payload", "updated_at"])
        order_services.mark_order_paid(payment.order)
    elif status == Payment.Status.FAILED:
        payment.status = Payment.Status.FAILED
        payment.failure_reason = str(payload.get("failure_reason", "Payment failed."))[:255]
        payment.provider_payload = payload
        payment.save(update_fields=["status", "failure_reason", "provider_payload", "updated_at"])
        order_services.mark_order_payment_failed(payment.order)

    return payment, True
