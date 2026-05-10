"""
reviews/services.py — Business logic for reviews (NFR-MNT-003).

All write operations are centralised here.  Views delegate to
services instead of mutating models directly.

WHY A SEPARATE FILE?
--------------------
The project convention (see docs/CONVENTIONS.md, NFR-MNT-003) puts
all "business workflows" in ``services.py``.  This keeps views thin
and makes it easy to test business rules without HTTP overhead.

Compare with ``apps/products/services.py`` for the same pattern.
"""
from __future__ import annotations

from django.db import IntegrityError
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.products.models import Product

from .models import Review


def create_review(
    *,
    user,
    product: Product,
    rating: int,
    comment: str = "",
) -> Review:
    """Create a new review for a product (FR-REV-001).

    Business rules enforced
    -----------------------
    * The product must be active.
    * One active review per user per product (FR-REV-002).
      The database constraint ``unique_active_review_per_user_product``
      catches race conditions, but we also do a pre-check for a
      friendlier error message.

    Parameters
    ----------
    user : CustomUser
        The authenticated customer submitting the review.
    product : Product
        The product being reviewed (must be active).
    rating : int
        Integer 1–5 (validated by model validators).
    comment : str
        Optional written feedback (FR-REV-004).

    Raises
    ------
    ValidationError
        If the user already has an active review for this product.
    """
    # Pre-check for a friendly error message (avoids raw IntegrityError).
    if Review.objects.filter(
        user=user, product=product, deleted_at__isnull=True
    ).exists():
        raise ValidationError(
            {"product": ["You have already reviewed this product."]}
        )

    try:
        review = Review.objects.create(
            user=user,
            product=product,
            rating=rating,
            comment=comment,
        )
    except IntegrityError as exc:
        # Race condition: another request created a review between
        # the pre-check and the INSERT.  Re-raise as a validation
        # error so the API returns 400 instead of 500.
        raise ValidationError(
            {"product": ["You have already reviewed this product."]}
        ) from exc

    return review


def update_review(review: Review, **fields) -> Review:
    """Update a review's rating and/or comment (FR-REV-005).

    Only ``rating`` and ``comment`` are updatable.  Other fields
    like ``user``, ``product``, and ``is_visible`` are immutable
    from the customer's perspective.

    Parameters
    ----------
    review : Review
        The review instance to update (must be owned by the caller).
    **fields
        Keyword arguments for the fields to update.

    Returns
    -------
    Review
        The updated review instance.
    """
    allowed = {"rating", "comment"}
    update_fields: list[str] = []

    for key, value in fields.items():
        if key in allowed:
            setattr(review, key, value)
            update_fields.append(key)

    if update_fields:
        review.full_clean()
        review.save(update_fields=update_fields + ["updated_at"])

    return review


def delete_review(review: Review) -> Review:
    """Soft-delete a review by setting ``deleted_at`` (FR-REV-006).

    WHY SOFT-DELETE?
    ----------------
    The SRS (section 7.13) specifies a ``deleted_at`` field, and
    FR-ADM-005 says historical reviews should be preserved when
    users are soft-deleted.  Soft-deleting the review itself is
    consistent: the data is preserved for admin/audit purposes,
    and the conditional unique constraint allows the user to
    submit a new review for the same product later.
    """
    review.deleted_at = timezone.now()
    review.save(update_fields=["deleted_at", "updated_at"])
    return review


# ── Admin moderation (FR-ADM-011) ────────────────────────────────


def hide_review(review: Review) -> Review:
    """Hide a review from public display (FR-ADM-011).

    Sets ``is_visible=False``.  The review still exists and the
    customer can still see it in their "my reviews" view; it is
    simply excluded from the public product review listing.
    """
    review.is_visible = False
    review.save(update_fields=["is_visible", "updated_at"])
    return review


def unhide_review(review: Review) -> Review:
    """Restore a hidden review to public display.

    This is the inverse of ``hide_review``.  Useful when an admin
    hides a review by mistake and needs to undo the action.
    """
    review.is_visible = True
    review.save(update_fields=["is_visible", "updated_at"])
    return review
