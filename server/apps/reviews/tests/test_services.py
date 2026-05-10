"""
Test suite for reviews/services.py (NFR-TST-001).

Tests the business logic layer in isolation — no HTTP requests needed.
Each test calls a service function directly and asserts the database
state afterward.
"""
from __future__ import annotations

import pytest
from rest_framework.exceptions import ValidationError

from apps.products.models import Product
from apps.reviews.models import Review
from apps.reviews.services import (
    create_review,
    delete_review,
    hide_review,
    unhide_review,
    update_review,
)
from apps.users.models import CustomUser


# ── create_review ─────────────────────────────────────────────────


@pytest.mark.django_db
class TestCreateReview:
    """Tests for ``services.create_review``."""

    def test_creates_review_with_valid_data(
        self, user: CustomUser, product: Product
    ) -> None:
        """FR-REV-001: authenticated customer can create a review."""
        review = create_review(user=user, product=product, rating=5, comment="Great!")

        assert review.pk is not None
        assert review.user == user
        assert review.product == product
        assert review.rating == 5
        assert review.comment == "Great!"
        assert review.is_visible is True
        assert review.deleted_at is None

    def test_creates_review_without_comment(
        self, user: CustomUser, product: Product
    ) -> None:
        """FR-REV-004: comment is optional."""
        review = create_review(user=user, product=product, rating=3)

        assert review.comment == ""

    def test_rejects_duplicate_active_review(
        self, user: CustomUser, product: Product
    ) -> None:
        """FR-REV-002: one active review per user per product."""
        create_review(user=user, product=product, rating=4)

        with pytest.raises(ValidationError) as exc_info:
            create_review(user=user, product=product, rating=5)

        assert "already reviewed" in str(exc_info.value.detail)

    def test_allows_new_review_after_soft_delete(
        self, user: CustomUser, product: Product
    ) -> None:
        """After soft-deleting, the user can review the same product again."""
        old_review = create_review(user=user, product=product, rating=2)
        delete_review(old_review)

        new_review = create_review(user=user, product=product, rating=5, comment="Changed my mind")

        assert new_review.pk != old_review.pk
        assert new_review.deleted_at is None

    def test_different_users_can_review_same_product(
        self, user: CustomUser, other_user: CustomUser, product: Product
    ) -> None:
        """Two different users can each review the same product."""
        r1 = create_review(user=user, product=product, rating=4)
        r2 = create_review(user=other_user, product=product, rating=5)

        assert r1.pk != r2.pk


# ── update_review ─────────────────────────────────────────────────


@pytest.mark.django_db
class TestUpdateReview:
    """Tests for ``services.update_review``."""

    def test_updates_rating(self, user: CustomUser, product: Product) -> None:
        """FR-REV-005: customer can update rating."""
        review = create_review(user=user, product=product, rating=3)
        updated = update_review(review, rating=5)

        assert updated.rating == 5

    def test_updates_comment(self, user: CustomUser, product: Product) -> None:
        """FR-REV-005: customer can update comment."""
        review = create_review(user=user, product=product, rating=3, comment="Old")
        updated = update_review(review, comment="New comment")

        assert updated.comment == "New comment"

    def test_ignores_disallowed_fields(
        self, user: CustomUser, product: Product
    ) -> None:
        """Only rating and comment are updatable — other fields are ignored."""
        review = create_review(user=user, product=product, rating=3)
        updated = update_review(review, rating=4, is_visible=False)

        assert updated.rating == 4
        assert updated.is_visible is True  # unchanged


# ── delete_review ─────────────────────────────────────────────────


@pytest.mark.django_db
class TestDeleteReview:
    """Tests for ``services.delete_review``."""

    def test_soft_deletes_by_setting_deleted_at(
        self, user: CustomUser, product: Product
    ) -> None:
        """FR-REV-006: delete sets deleted_at (soft-delete)."""
        review = create_review(user=user, product=product, rating=4)
        deleted = delete_review(review)

        assert deleted.deleted_at is not None
        # The row still exists in the database.
        assert Review.objects.filter(pk=review.pk).exists()


# ── hide_review / unhide_review ───────────────────────────────────


@pytest.mark.django_db
class TestModeration:
    """Tests for ``services.hide_review`` and ``services.unhide_review``."""

    def test_hide_sets_is_visible_false(
        self, user: CustomUser, product: Product
    ) -> None:
        """FR-ADM-011: admin can hide a review."""
        review = create_review(user=user, product=product, rating=4)
        hidden = hide_review(review)

        assert hidden.is_visible is False

    def test_unhide_restores_visibility(
        self, user: CustomUser, product: Product
    ) -> None:
        """Unhiding restores the review to public display."""
        review = create_review(user=user, product=product, rating=4)
        hide_review(review)
        restored = unhide_review(review)

        assert restored.is_visible is True
