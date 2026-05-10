"""
reviews/permissions.py — Object-level permissions for reviews.

WHY A CUSTOM PERMISSION?
-------------------------
DRF's built-in ``IsAuthenticated`` checks *who you are*, but not
*what you own*.  For FR-REV-009 ("Customers shall not edit or delete
reviews created by other users"), we need **object-level** permission
checking.

Without this, the previous implementation filtered the queryset by
``user=request.user`` which returned a 404 for other users' reviews.
That's misleading — a 404 means "doesn't exist", but the review
*does* exist; you just don't have permission.  A 403 is correct.

HOW IT WORKS
------------
DRF calls ``has_object_permission()`` after ``get_object()`` retrieves
the model instance.  If it returns ``False``, DRF raises a
``PermissionDenied`` exception → 403 response.
"""
from __future__ import annotations

from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView

from .models import Review


class IsReviewOwner(permissions.BasePermission):
    """Only the review author can modify (update/delete) the review.

    Read-safe: allows GET/HEAD/OPTIONS for any authenticated user.
    Write-restricted: only the owner can PATCH/DELETE.
    """

    def has_object_permission(
        self, request: Request, view: APIView, obj: Review
    ) -> bool:
        # SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')
        if request.method in permissions.SAFE_METHODS:
            return True

        # For write methods, check ownership.
        return obj.user_id == request.user.id
