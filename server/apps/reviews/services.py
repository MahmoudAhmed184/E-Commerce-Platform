"""
reviews/services.py — Business logic for reviews (NFR-MNT-003).

All write operations are centralized here. Views delegate to services
instead of mutating models directly, and serializers only validate.

Why a separate module?
  Your project convention (NFR-MNT-003) says "business workflows live in
  services.py." This means:
    - Serializers validate incoming data but never call .save() or .create()
    - Views handle HTTP plumbing (parse request, call service, return response)
    - Services contain the actual business rules and database mutations
"""
from __future__ import annotations

from django.db import IntegrityError
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.products.models import Product
from apps.users.models import CustomUser

from .models import Review


def create_review(
    *,
    user: CustomUser,
    product: Product,
    rating: int,
    comment: str = "",
) -> Review:
    """Create a new review for a product (FR-REV-001, FR-REV-002).

    Business rules:
      - Each customer can have only ONE active review per product (FR-REV-002).
        The database constraint ``unique_active_review_per_user_product``
        enforces this. If a user tries to create a second active review,
        we catch the IntegrityError and raise a friendly validation error.
      - Rating must be 1-5 (enforced at model level via validators).
      - Comment is optional (FR-REV-004).

    Args:
        user: The authenticated customer creating the review.
        product: The product being reviewed.
        rating: Integer from 1 to 5.
        comment: Optional review text.

    Returns:
        The newly created Review instance.

    Raises:
        ValidationError: If the user already has an active review for this product.
    """
    try:
        review = Review(
            user=user,
            product=product,
            rating=rating,
            comment=comment,
        )
        review.full_clean()
        review.save()
        return review
    except IntegrityError as exc:
        raise ValidationError(
            {"product": ["You have already reviewed this product."]}
        ) from exc


def update_review(review: Review, **fields: object) -> Review:
    """Update an existing review's rating and/or comment (FR-REV-005).

    Only ``rating`` and ``comment`` are allowed to be changed.
    Other fields (user, product, visibility, timestamps) are immutable
    from the customer's perspective.

    Args:
        review: The Review instance to update.
        **fields: Keyword arguments for fields to change.

    Returns:
        The updated Review instance.
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
    """Soft-delete a review by setting deleted_at (FR-REV-006).

    We don't actually remove the row from the database. Instead, we set
    ``deleted_at`` to the current time. This:
      1. Preserves historical data (the review existed).
      2. Removes it from public display (selectors filter by deleted_at__isnull=True).
      3. Frees the unique constraint so the user can leave a new review.

    Returns:
        The soft-deleted Review instance.
    """
    review.deleted_at = timezone.now()
    review.save(update_fields=["deleted_at", "updated_at"])
    return review


def hide_review(review: Review) -> Review:
    """Hide a review from public display — admin moderation (FR-ADM-011).

    Sets ``is_visible=False``. The review still exists and the customer
    can still see it in their own review list, but it won't appear on
    the product page.
    """
    review.is_visible = False
    review.save(update_fields=["is_visible", "updated_at"])
    return review


def unhide_review(review: Review) -> Review:
    """Restore a hidden review's visibility — admin moderation reversal.

    Sets ``is_visible=True``. Useful when an admin accidentally hides
    a legitimate review.
    """
    review.is_visible = True
    review.save(update_fields=["is_visible", "updated_at"])
    return review
