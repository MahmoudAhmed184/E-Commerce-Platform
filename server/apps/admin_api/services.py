from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from apps.reviews.models import Review
from apps.users.models import CustomUser


@transaction.atomic
def approve_user(user: CustomUser) -> CustomUser:
    user.status = CustomUser.Status.ACTIVE
    user.is_email_confirmed = True
    user.save(update_fields=["status", "is_email_confirmed", "updated_at"])
    return user


@transaction.atomic
def restrict_user(user: CustomUser) -> CustomUser:
    user.status = CustomUser.Status.RESTRICTED
    user.save(update_fields=["status", "updated_at"])
    return user


@transaction.atomic
def soft_delete_user(user: CustomUser) -> CustomUser:
    user.status = CustomUser.Status.DELETED
    user.deleted_at = timezone.now()
    user.save(update_fields=["status", "deleted_at", "updated_at"])
    return user


@transaction.atomic
def hide_review(review: Review) -> Review:
    review.is_visible = False
    review.save(update_fields=["is_visible", "updated_at"])
    return review


@transaction.atomic
def unhide_review(review: Review) -> Review:
    review.is_visible = True
    review.save(update_fields=["is_visible", "updated_at"])
    return review


@transaction.atomic
def delete_review(review: Review) -> None:
    review.delete()
