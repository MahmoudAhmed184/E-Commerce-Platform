from __future__ import annotations

from django.db.models import Q, QuerySet

from apps.users.models import CustomUser

from .models import Order


def get_order_base_queryset() -> QuerySet[Order]:
    return Order.objects.prefetch_related("items").select_related("payment")


def get_user_orders(user: CustomUser) -> QuerySet[Order]:
    return get_order_base_queryset().filter(user=user).order_by("-created_at")


def get_admin_retrievable_orders() -> QuerySet[Order]:
    return get_order_base_queryset()


def get_user_retrievable_orders(
    user: CustomUser,
    *,
    include_guest_context: bool = False,
) -> QuerySet[Order]:
    order_filter = Q(user=user)
    if include_guest_context:
        order_filter |= Q(user__isnull=True)
    return get_order_base_queryset().filter(order_filter)


def get_guest_orders() -> QuerySet[Order]:
    return get_order_base_queryset().filter(user__isnull=True)


def get_no_orders() -> QuerySet[Order]:
    return get_order_base_queryset().none()
