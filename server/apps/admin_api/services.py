"""
admin_api/services.py — Business logic for admin operations (NFR-MNT-003).

All admin write operations are centralized here. Views delegate to
services instead of mutating models directly.

Key design pattern: CROSS-APP DELEGATION
  The review moderation functions here delegate to ``apps.reviews.services``
  rather than duplicating the logic. This means:
    - There's ONE place where ``is_visible`` is toggled (reviews/services.py)
    - There's ONE place where ``deleted_at`` is set (reviews/services.py)
    - If the soft-delete logic ever changes, it changes in one place.
"""
from __future__ import annotations

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.reviews.models import Review
from apps.reviews.services import delete_review as review_soft_delete
from apps.reviews.services import hide_review, unhide_review
from apps.users.models import CustomUser


def approve_user(user: CustomUser) -> CustomUser:
    """Approve a pending user account (FR-ADM-003).

    Business rules:
      - Only users with status ``pending_approval`` can be approved.
      - Approving also confirms the user's email (since the admin is
        manually verifying the account).
      - Attempting to approve a non-pending user returns a clear error.

    Args:
        user: The user to approve.

    Returns:
        The updated user instance.

    Raises:
        ValidationError: If user is not in pending_approval status.
    """
    if user.status != CustomUser.Status.PENDING:
        raise ValidationError(
            {"status": [f"Only pending_approval users can be approved. "
                        f"This user's status is '{user.status}'."]}
        )

    user.status = CustomUser.Status.ACTIVE
    user.is_email_confirmed = True
    user.save(update_fields=["status", "is_email_confirmed", "updated_at"])
    return user


def restrict_user(user: CustomUser) -> CustomUser:
    """Restrict a user account (FR-ADM-004).

    Business rules:
      - Cannot restrict an already soft-deleted user (that doesn't make
        sense — they're already removed from active flows).
      - Restricted users are blocked from login and placing new orders.

    Args:
        user: The user to restrict.

    Returns:
        The updated user instance.

    Raises:
        ValidationError: If user is already soft-deleted.
    """
    if user.status == CustomUser.Status.DELETED:
        raise ValidationError(
            {"status": ["Cannot restrict a soft-deleted user."]}
        )

    user.status = CustomUser.Status.RESTRICTED
    user.save(update_fields=["status", "updated_at"])
    return user


def activate_user(user: CustomUser) -> CustomUser:
    """Restore a user account to active status.

    This can bring restricted or soft-deleted accounts back into an
    active state so admins can re-enable customers after review.
    """
    if user.status == CustomUser.Status.ACTIVE and user.is_active:
        raise ValidationError(
            {"status": ["User is already active."]}
        )

    user.status = CustomUser.Status.ACTIVE
    user.is_active = True
    user.is_email_confirmed = True
    user.deleted_at = None
    user.save(update_fields=["status", "is_active", "is_email_confirmed", "deleted_at", "updated_at"])
    return user


def soft_delete_user(user: CustomUser) -> CustomUser:
    """Soft-delete a user account (FR-ADM-005).

    Sets ``deleted_at`` and changes status to ``soft_deleted``.
    Historical orders and reviews are preserved — we never hard-delete
    a user row.

    Args:
        user: The user to soft-delete.

    Returns:
        The updated user instance.
    """
    user.status = CustomUser.Status.DELETED
    user.deleted_at = timezone.now()
    user.save(update_fields=["status", "deleted_at", "updated_at"])
    return user


def admin_hide_review(review: Review) -> Review:
    """Hide a review from public display — admin moderation (FR-ADM-011).

    Delegates to ``apps.reviews.services.hide_review()`` so there's
    one canonical place for toggling review visibility.
    """
    return hide_review(review)


def admin_unhide_review(review: Review) -> Review:
    """Restore a hidden review's visibility.

    Delegates to ``apps.reviews.services.unhide_review()``.
    """
    return unhide_review(review)


def admin_delete_review(review: Review) -> Review:
    """Soft-delete a review via admin moderation (FR-ADM-011).

    Delegates to ``apps.reviews.services.delete_review()`` which sets
    ``deleted_at`` rather than hard-deleting the row. This is consistent
    with customer-side review deletion from P2-BE-REV-001.
    """
    return review_soft_delete(review)
