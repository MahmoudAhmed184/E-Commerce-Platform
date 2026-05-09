from django.contrib import admin

from .models import Payment, PaymentWebhookEvent, Wallet, WalletLedgerEntry


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("order", "method", "status", "amount", "provider_reference", "created_at")
    list_filter = ("method", "status", "created_at")
    search_fields = ("order__order_number", "provider_reference", "idempotency_key")


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("user", "balance", "updated_at")
    search_fields = ("user__email",)


@admin.register(WalletLedgerEntry)
class WalletLedgerEntryAdmin(admin.ModelAdmin):
    list_display = ("wallet", "entry_type", "amount", "balance_after", "created_at")
    list_filter = ("entry_type", "created_at")


@admin.register(PaymentWebhookEvent)
class PaymentWebhookEventAdmin(admin.ModelAdmin):
    list_display = ("event_id", "provider_reference", "status", "processed_at")
    search_fields = ("event_id", "provider_reference")
