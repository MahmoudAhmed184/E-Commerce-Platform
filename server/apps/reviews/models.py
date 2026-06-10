"""
reviews/models.py — Review data model (SRS 7.13).

Each review ties a user to a product with a 1-5 rating and optional comment.

Key design decisions:
  - ``is_visible``: Admin moderation flag. Hidden reviews still exist but
    are excluded from public queries (FR-ADM-011).
  - ``deleted_at``: Customer soft-delete timestamp. When a customer "deletes"
    their review, we set this instead of removing the row. This preserves
    historical data and lets the customer leave a new review later (FR-REV-006).
  - The unique constraint uses ``condition=Q(deleted_at__isnull=True)`` so it
    only applies to active (non-deleted) reviews — this is the "one active
    review per customer per product" rule from FR-REV-002.
"""
from __future__ import annotations

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="reviews",
        on_delete=models.CASCADE,
    )
    product = models.ForeignKey(
        "products.Product",
        related_name="reviews",
        on_delete=models.CASCADE,
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField(blank=True)
    is_visible = models.BooleanField(default=True, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            # Only one active (non-deleted) review per user per product.
            # Soft-deleted reviews (deleted_at is set) are excluded from
            # this constraint, so a user can re-review after deletion.
            models.UniqueConstraint(
                fields=["user", "product"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_active_review_per_user_product",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.product_id} review by {self.user_id}"
