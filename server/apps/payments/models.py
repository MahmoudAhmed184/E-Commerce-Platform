from __future__ import annotations

from django.conf import settings
from django.db import models


class Payment(models.Model):
    class Method(models.TextChoices):
        CARD = "card", "Card"
        COD = "cod", "Cash on delivery"
        WALLET = "wallet", "Wallet"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        COD_PENDING = "cod_pending", "Cash on delivery pending"

    order = models.OneToOneField("orders.Order", related_name="payment", on_delete=models.CASCADE)
    method = models.CharField(max_length=20, choices=Method.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    provider_reference = models.CharField(max_length=128, unique=True, null=True, blank=True)
    idempotency_key = models.CharField(max_length=128, unique=True, null=True, blank=True)
    failure_reason = models.CharField(max_length=255, blank=True)
    provider_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.order.order_number} - {self.method} - {self.status}"


class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="wallet", on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Wallet for {self.user_id}"


class WalletLedgerEntry(models.Model):
    class EntryType(models.TextChoices):
        CREDIT = "credit", "Credit"
        DEBIT = "debit", "Debit"

    wallet = models.ForeignKey(Wallet, related_name="ledger_entries", on_delete=models.CASCADE)
    payment = models.ForeignKey(Payment, related_name="wallet_entries", null=True, blank=True, on_delete=models.SET_NULL)
    entry_type = models.CharField(max_length=10, choices=EntryType.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class PaymentWebhookEvent(models.Model):
    event_id = models.CharField(max_length=128, unique=True)
    provider_reference = models.CharField(max_length=128, db_index=True)
    status = models.CharField(max_length=20)
    payload = models.JSONField(default=dict, blank=True)
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-processed_at"]
