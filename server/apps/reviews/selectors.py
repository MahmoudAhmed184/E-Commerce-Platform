"""
reviews/selectors.py — Query logic for reviews (NFR-MNT-004).

All read-side review queries are centralized here. Views call selectors
instead of building querysets directly.

Why a separate module?
  Your project convention (NFR-MNT-004) says "query logic lives in
  selectors.py." This keeps views thin (they only handle HTTP plumbing)
  and makes queries easy to test in isolation.
"""
from __future__ import annotations

from typing import Any

from django.db.models import Avg, Count, FloatField, Q, QuerySet, Value
from django.db.models.functions import Coalesce

from apps.products.models import Product

from .models import Review


def get_visible_product_reviews(product: Product) -> QuerySet[Review]:
    """Return visible, non-deleted reviews for a product (FR-REV-007).

    "Visible" means:
      - ``is_visible=True`` (not hidden by an admin)
      - ``deleted_at`` is NULL (not soft-deleted by the customer)

    Results are pre-fetched with user/product to avoid N+1 queries when
    the serializer accesses ``review.user.full_name``.
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


def get_product_review_aggregates(product: Product) -> dict[str, Any]:
    """Return average rating and review count for a product (FR-REV-008).

    Only counts visible, non-deleted reviews so that hidden/moderated
    reviews don't skew the numbers displayed on the product page.

    Returns:
        {"average_rating": float, "review_count": int}
    """
    result = Review.objects.filter(
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
    return result


def get_user_active_reviews(user: Any) -> QuerySet[Review]:
    """Return active (non-deleted) reviews owned by a user.

    Used by the ReviewViewSet so a customer can only see/edit/delete
    their own reviews. Soft-deleted reviews are excluded because the
    customer already "deleted" them.
    """
    return (
        Review.objects.filter(
            user=user,
            deleted_at__isnull=True,
        )
        .select_related("user", "product")
    )
