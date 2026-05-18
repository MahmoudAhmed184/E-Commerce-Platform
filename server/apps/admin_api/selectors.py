"""
admin_api/selectors.py — Query logic for admin operations (NFR-MNT-004).

All admin read-side queries are centralized here. Views call selectors
instead of building querysets directly.

These selectors deliberately return ALL records (not just active ones)
because admins need visibility into every account state, including
soft-deleted users, hidden reviews, etc.
"""
from __future__ import annotations

from django.db.models import Q, QuerySet

from apps.orders.models import Order
from apps.payments.models import Payment
from apps.products.models import Product
from apps.reviews.models import Review
from apps.users.models import CustomUser


def get_admin_users(*, search: str | None = None) -> QuerySet[CustomUser]:
    """Return all users, optionally filtered by search term (FR-ADM-001, FR-ADM-002).

    Search matches against email, phone, or full_name using case-insensitive
    partial matching. This lets admins type a fragment and find matching users.

    Unlike customer-facing selectors, this returns ALL users including
    soft-deleted ones — admins need full visibility.
    """
    queryset = CustomUser.objects.all().order_by("-created_at")

    if search:
        search = search.strip()
        queryset = queryset.filter(
            Q(email__icontains=search)
            | Q(phone__icontains=search)
            | Q(full_name__icontains=search)
        )

    return queryset


def get_admin_orders(
    *,
    status: str | None = None,
    payment_status: str | None = None,
) -> QuerySet[Order]:
    """Return all orders, optionally filtered by status (FR-ADM-010).

    Admins can filter by order status (pending, confirmed, cancelled, failed)
    and/or payment status (pending, paid, failed, cod_pending) to quickly
    find orders that need attention.
    """
    queryset = Order.objects.all().order_by("-created_at")

    if status:
        queryset = queryset.filter(status=status)
    if payment_status:
        queryset = queryset.filter(payment_status=payment_status)

    return queryset


def get_admin_payments(*, status: str | None = None) -> QuerySet[Payment]:
    """Return all payments with related order data (FR-ADM-010).

    Pre-fetches the related order to avoid N+1 queries when the
    serializer accesses ``payment.order.order_number``.
    """
    queryset = Payment.objects.select_related("order").order_by("-created_at")

    if status:
        queryset = queryset.filter(status=status)

    return queryset


def get_admin_reviews() -> QuerySet[Review]:
    """Return all reviews for the moderation queue (FR-ADM-011).

    Returns ALL reviews (visible, hidden, and soft-deleted) so admins
    can see the full picture and moderate accordingly. Pre-fetches
    user and product to avoid N+1 queries.
    """
    return (
        Review.objects.select_related("user", "product")
        .order_by("-created_at")
    )


def get_admin_dashboard_stats() -> dict:
    """Return aggregated statistics for the admin dashboard."""
    from django.db.models import Sum
    
    total_users = CustomUser.objects.exclude(status=CustomUser.Status.DELETED).count()
    pending_users_count = CustomUser.objects.filter(status=CustomUser.Status.PENDING).count()
    
    total_products = Product.objects.count()
    total_orders = Order.objects.count()
    
    # Calculate total revenue from paid orders
    total_revenue = Order.objects.filter(
        payment_status=Order.PaymentStatus.PAID
    ).aggregate(total=Sum("total_amount"))["total"] or 0
    
    recent_orders = Order.objects.all().order_by("-created_at")[:5]
    recent_payments = Payment.objects.select_related("order").order_by("-created_at")[:5]
    recent_reviews = Review.objects.select_related("user", "product").order_by("-created_at")[:5]
    
    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "pending_users_count": pending_users_count,
        "recent_orders": recent_orders,
        "recent_payments": recent_payments,
        "recent_reviews": recent_reviews,
    }
