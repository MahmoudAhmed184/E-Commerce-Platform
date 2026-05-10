"""
tests/test_services.py — Unit tests for admin_api/services.py.

Tests verify admin business logic in isolation: validation guardrails,
status transitions, and cross-app delegation to review services.
"""
from __future__ import annotations

import pytest
from rest_framework.exceptions import ValidationError

from apps.admin_api.services import (
    admin_delete_review,
    admin_hide_review,
    admin_unhide_review,
    approve_user,
    restrict_user,
    soft_delete_user,
)
from apps.reviews.models import Review
from apps.users.models import CustomUser


# ─── approve_user ────────────────────────────────────────────────────


@pytest.mark.django_db
class TestApproveUser:

    def test_approves_pending_user(self, pending_customer: CustomUser) -> None:
        """FR-ADM-003: Approve changes status to active."""
        user = approve_user(pending_customer)

        assert user.status == CustomUser.Status.ACTIVE
        assert user.is_email_confirmed is True
        pending_customer.refresh_from_db()
        assert pending_customer.status == CustomUser.Status.ACTIVE

    def test_rejects_already_active_user(self, active_customer: CustomUser) -> None:
        """Only pending_approval users can be approved."""
        with pytest.raises(ValidationError) as exc_info:
            approve_user(active_customer)

        assert "pending_approval" in str(exc_info.value.detail)

    def test_rejects_restricted_user(self, active_customer: CustomUser) -> None:
        """Restricted users cannot be approved — they need a different workflow."""
        active_customer.status = CustomUser.Status.RESTRICTED
        active_customer.save(update_fields=["status"])

        with pytest.raises(ValidationError) as exc_info:
            approve_user(active_customer)

        assert "pending_approval" in str(exc_info.value.detail)

    def test_rejects_deleted_user(self, active_customer: CustomUser) -> None:
        """Soft-deleted users cannot be approved."""
        active_customer.status = CustomUser.Status.DELETED
        active_customer.save(update_fields=["status"])

        with pytest.raises(ValidationError):
            approve_user(active_customer)


# ─── restrict_user ───────────────────────────────────────────────────


@pytest.mark.django_db
class TestRestrictUser:

    def test_restricts_active_user(self, active_customer: CustomUser) -> None:
        """FR-ADM-004: Restrict sets status to restricted."""
        user = restrict_user(active_customer)

        assert user.status == CustomUser.Status.RESTRICTED
        active_customer.refresh_from_db()
        assert active_customer.status == CustomUser.Status.RESTRICTED

    def test_rejects_deleted_user(self, active_customer: CustomUser) -> None:
        """Cannot restrict a soft-deleted user."""
        active_customer.status = CustomUser.Status.DELETED
        active_customer.save(update_fields=["status"])

        with pytest.raises(ValidationError) as exc_info:
            restrict_user(active_customer)

        assert "soft-deleted" in str(exc_info.value.detail).lower()


# ─── soft_delete_user ────────────────────────────────────────────────


@pytest.mark.django_db
class TestSoftDeleteUser:

    def test_soft_deletes_user(self, active_customer: CustomUser) -> None:
        """FR-ADM-005: Soft-delete sets deleted_at and changes status."""
        user = soft_delete_user(active_customer)

        assert user.status == CustomUser.Status.DELETED
        assert user.deleted_at is not None
        active_customer.refresh_from_db()
        assert active_customer.status == CustomUser.Status.DELETED


# ─── Review moderation (delegation) ─────────────────────────────────


@pytest.mark.django_db
class TestAdminReviewModeration:

    def test_hide_review(self, review: Review) -> None:
        """FR-ADM-011: Admin can hide a review."""
        result = admin_hide_review(review)

        assert result.is_visible is False
        review.refresh_from_db()
        assert review.is_visible is False

    def test_unhide_review(self, review: Review) -> None:
        """Admin can restore a hidden review."""
        admin_hide_review(review)
        result = admin_unhide_review(review)

        assert result.is_visible is True
        review.refresh_from_db()
        assert review.is_visible is True

    def test_delete_review_is_soft_delete(self, review: Review) -> None:
        """FR-ADM-011: Admin delete uses soft-delete, not hard-delete."""
        admin_delete_review(review)

        review.refresh_from_db()
        assert review.deleted_at is not None
        assert Review.objects.filter(pk=review.pk).exists()
