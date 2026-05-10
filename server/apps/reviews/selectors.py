"""
reviews/selectors.py — Query logic for reviews (NFR-MNT-004).

All read-side queries are centralised here.  Views call selectors
instead of building querysets directly.

WHY A SEPARATE FILE?
--------------------
The project convention (see docs/CONVENTIONS.md, NFR-MNT-004) puts
all query composition in ``selectors.py``.  This keeps views thin
(they only handle HTTP plumbing) and makes queries easy to test
in isolation without spinning up an HTTP request.
"""
from __future__ import annotations

from django.db.models import Avg, Count, FloatField, QuerySet, Value
from django.db.models.functions import Coalesce

from apps.products.models import Product

from .models import Review


# ── Public review queries ─────────────────────────────────────────


def get_visible_product_reviews(product: Product) -> QuerySet[Review]:
    """Return visible, non-deleted reviews for a product (FR-REV-007).

    "Visible" means:
    • ``is_visible=True``  (not hidden by an admin)
    • ``deleted_at`` is NULL  (not soft-deleted by the customer)

    Results are pre-loaded with ``user`` and ``product`` to avoid
    N+1 queries when the serializer reads ``user.full_name``.
    """
    return (
        Review.objects.filter(
            product=product,
            is_visible=True,
            deleted_at__isnull=True,
        )
        .select_related("user", "product")
        .order_by("-created_at")
    )


def get_product_review_aggregates(product: Product) -> dict[str, object]:
    """Return average rating and review count for a product (FR-REV-008).

    Only visible, non-deleted reviews are included in the aggregates.
    Returns a dict like ``{"average_rating": 4.2, "review_count": 17}``.

    WHY ``Coalesce``?
    -----------------
    If a product has zero visible reviews, ``Avg()`` returns ``None``.
    ``Coalesce`` converts that to ``0.0`` so callers never need to
    handle a nullable float.
    """
    return Review.objects.filter(
        product=product,
        is_visible=True,
        deleted_at__isnull=True,
    ).aggregate(
        average_rating=Coalesce(
            Avg("rating"),
            Value(0.0),
            output_field=FloatField(),
        ),
        review_count=Count("id"),
    )


# ── Owner-scoped queries ─────────────────────────────────────────


def get_user_active_reviews(user) -> QuerySet[Review]:
    """Return all active (non-deleted) reviews by a user.

    Used by the ReviewViewSet to scope the queryset to the
    authenticated user's own reviews for edit/delete operations.
    """
    return (
        Review.objects.filter(user=user, deleted_at__isnull=True)
        .select_related("user", "product")
        .order_by("-created_at")
    )
