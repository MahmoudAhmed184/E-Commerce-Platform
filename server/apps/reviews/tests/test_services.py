"""
tests/test_services.py — Unit tests for reviews/services.py.

These tests verify the BUSINESS LOGIC in isolation:
  - Does create_review actually make a Review row?
  - Does the duplicate constraint work?
  - Does soft-delete set deleted_at?
  - Does hide/unhide toggle is_visible?

We test services directly (not through the API) so we can pinpoint
exactly where a failure comes from. If a service test fails, the
problem is in the business logic. If an API test fails but the service
test passes, the problem is in the view/serializer layer.
"""
from __future__ import annotations

import pytest
from django.utils import timezone
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


@pytest.mark.django_db
class TestCreateReview:
    """Tests for services.create_review()."""

    def test_creates_review_successfully(
        self, user: CustomUser, product: Product
    ) -> None:
        """FR-REV-001: Authenticated customer can create a review."""
        review = create_review(
            user=user, product=product, rating=5, comment="Amazing!"
        )

        assert review.pk is not None
        assert review.user == user
        assert review.product == product
        assert review.rating == 5
        assert review.comment == "Amazing!"
        assert review.is_visible is True
        assert review.deleted_at is None

    def test_creates_review_without_comment(
        self, user: CustomUser, product: Product
    ) -> None:
        """FR-REV-004: Comment is optional."""
        review = create_review(user=user, product=product, rating=3)

        assert review.comment == ""

    def test_duplicate_active_review_raises_validation_error(
        self, user: CustomUser, product: Product
    ) -> None:
        """FR-REV-002: One active review per customer per product."""
        create_review(user=user, product=product, rating=4)

        with pytest.raises(ValidationError) as exc_info:
            create_review(user=user, product=product, rating=5)

        # Check that the error message is user-friendly
        assert "already reviewed" in str(exc_info.value.detail)

    def test_can_create_review_after_soft_delete(
        self, user: CustomUser, product: Product
    ) -> None:
        """After soft-deleting a review, user should be able to review again."""
        first_review = create_review(user=user, product=product, rating=3)
        delete_review(first_review)

        # This should succeed because the first review is soft-deleted
        second_review = create_review(
            user=user, product=product, rating=5, comment="Changed my mind!"
        )

        assert second_review.pk is not None
        assert second_review.pk != first_review.pk
        assert second_review.rating == 5


@pytest.mark.django_db
class TestUpdateReview:
    """Tests for services.update_review()."""

    def test_updates_rating(self, review: Review) -> None:
        """FR-REV-005: Customer can edit their review rating."""
        updated = update_review(review, rating=2)

        assert updated.rating == 2
        # Verify it's persisted to the database
        review.refresh_from_db()
        assert review.rating == 2

    def test_updates_comment(self, review: Review) -> None:
        """FR-REV-005: Customer can edit their review comment."""
        updated = update_review(review, comment="Updated comment")

        assert updated.comment == "Updated comment"
        review.refresh_from_db()
        assert review.comment == "Updated comment"

    def test_updates_both_fields(self, review: Review) -> None:
        """Can update rating and comment simultaneously."""
        updated = update_review(review, rating=1, comment="Terrible!")

        assert updated.rating == 1
        assert updated.comment == "Terrible!"

    def test_ignores_disallowed_fields(self, review: Review) -> None:
        """Only rating and comment should be updatable."""
        original_visibility = review.is_visible
        update_review(review, is_visible=False, rating=5)

        review.refresh_from_db()
        assert review.is_visible == original_visibility  # unchanged
        assert review.rating == 5  # changed

    def test_noop_when_no_fields_provided(self, review: Review) -> None:
        """Calling update with no fields should not error."""
        original_updated = review.updated_at
        update_review(review)

        review.refresh_from_db()
        # updated_at shouldn't change when no fields are modified
        assert review.updated_at == original_updated


@pytest.mark.django_db
class TestDeleteReview:
    """Tests for services.delete_review()."""

    def test_soft_deletes_review(self, review: Review) -> None:
        """FR-REV-006: Delete sets deleted_at, does NOT remove the row."""
        delete_review(review)

        review.refresh_from_db()
        assert review.deleted_at is not None
        # The row still exists in the database
        assert Review.objects.filter(pk=review.pk).exists()

    def test_soft_deleted_review_has_recent_timestamp(
        self, review: Review
    ) -> None:
        """deleted_at should be close to now."""
        before = timezone.now()
        delete_review(review)
        after = timezone.now()

        review.refresh_from_db()
        assert before <= review.deleted_at <= after


@pytest.mark.django_db
class TestHideUnhideReview:
    """Tests for services.hide_review() and unhide_review()."""

    def test_hide_sets_is_visible_false(self, review: Review) -> None:
        """FR-ADM-011: Admin can hide reviews from public display."""
        assert review.is_visible is True

        hide_review(review)

        review.refresh_from_db()
        assert review.is_visible is False

    def test_unhide_restores_visibility(self, review: Review) -> None:
        """Admin can restore a hidden review."""
        hide_review(review)
        unhide_review(review)

        review.refresh_from_db()
        assert review.is_visible is True
