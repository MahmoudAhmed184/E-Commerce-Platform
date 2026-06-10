from __future__ import annotations

from django.db.models import Q, QuerySet

from apps.orders.models import Order
from apps.payments.models import Payment
from apps.reviews.models import Review
from apps.users.models import CustomUser


def get_admin_users(search: str | None = None) -> QuerySet[CustomUser]:
    queryset = CustomUser.objects.all().order_by("-created_at")
    if search:
        queryset = queryset.filter(
            Q(email__icontains=search)
            | Q(phone__icontains=search)
            | Q(full_name__icontains=search)
        )
    return queryset


def get_admin_orders() -> QuerySet[Order]:
    return Order.objects.select_related("payment").order_by("-created_at")


def get_admin_payments() -> QuerySet[Payment]:
    return Payment.objects.select_related("order").order_by("-created_at")


def get_admin_reviews() -> QuerySet[Review]:
    return Review.objects.select_related("user", "product").order_by("-created_at")
