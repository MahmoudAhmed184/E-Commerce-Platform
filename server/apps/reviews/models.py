from __future__ import annotations

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Review(models.Model):
    """A product review submitted by an authenticated customer.

    Key business rules
    ------------------
    * One **active** review per customer per product (FR-REV-002).
      "Active" means ``deleted_at IS NULL``.  A conditional unique
      constraint enforces this at the database level.
    * ``is_visible`` is the admin moderation flag (FR-ADM-011).
      Setting it to False hides the review from public listings.
    * ``deleted_at`` records the customer's soft-delete timestamp
      (FR-REV-006 / SRS 7.13).  Soft-deleted reviews are excluded
      from all public queries but preserved for historical purposes.
    """

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
            # Only one non-deleted review per user+product (SRS 7.13).
            # Once a review is soft-deleted (deleted_at is set), the
            # constraint no longer blocks a new review for the same pair.
            models.UniqueConstraint(
                fields=["user", "product"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_active_review_per_user_product",
            ),
        ]
        indexes = [
            # Covers the most common query: visible, non-deleted
            # reviews for a product, ordered by created_at (desc).
            models.Index(
                fields=["product", "is_visible", "deleted_at"],
                name="idx_review_product_visible",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.product_id} review by {self.user_id}"
