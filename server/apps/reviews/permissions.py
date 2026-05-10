"""
reviews/permissions.py — Object-level permissions for reviews (FR-REV-009).

DRF has two levels of permission checking:
  1. **View-level** — checked before the view logic runs (e.g., IsAuthenticated).
  2. **Object-level** — checked when you call ``self.get_object()`` in a view.

The ``IsReviewOwner`` permission below is an object-level permission.
It runs after DRF retrieves the review from the database and checks
whether the requesting user is the author.

Why not just filter the queryset?
  The old code did ``Review.objects.filter(user=request.user)`` which
  returns 404 for reviews owned by other users. That's misleading —
  the review exists, you just can't touch it. A 403 is more honest
  and helps frontend developers show the right error message.
"""
from __future__ import annotations

from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView

from .models import Review


class IsReviewOwner(permissions.BasePermission):
    """Object-level permission: only the review author can modify.

    - Safe methods (GET, HEAD, OPTIONS) are always allowed — we don't
      use this permission on list endpoints anyway.
    - Unsafe methods (PATCH, DELETE) require ``obj.user_id == request.user.id``.

    If the check fails, DRF automatically returns 403 Forbidden with a
    message like "You do not have permission to perform this action."
    """

    message = "You can only modify your own reviews."

    def has_object_permission(
        self,
        request: Request,
        view: APIView,
        obj: Review,
    ) -> bool:
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for the review owner
        return obj.user_id == request.user.id
