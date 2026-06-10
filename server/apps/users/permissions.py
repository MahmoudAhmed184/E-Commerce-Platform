from __future__ import annotations

from typing import Any

from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission

from .models import CustomUser
from .services import AuthBlockedError, get_account_block_error


def _permission_detail(error: AuthBlockedError) -> dict[str, str]:
    return {
        "detail": error.detail,
        "code": error.code,
        "account_status": error.account_status,
    }


def enforce_active_account(user: Any) -> None:
    if not getattr(user, "is_authenticated", False):
        return

    blocked = get_account_block_error(user)
    if blocked is not None:
        raise PermissionDenied(detail=_permission_detail(blocked))


def has_admin_role(user: Any) -> bool:
    return (
        getattr(user, "is_authenticated", False)
        and getattr(user, "role", None) == CustomUser.Role.ADMIN
    )


class IsActiveAccount(BasePermission):
    message = "Your account is not active."

    def has_permission(self, request, view) -> bool:
        if not getattr(request.user, "is_authenticated", False):
            return False

        enforce_active_account(request.user)
        return True


class IsAdminRole(BasePermission):
    message = "Admin role required."

    def has_permission(self, request, view) -> bool:
        if not getattr(request.user, "is_authenticated", False):
            return False

        enforce_active_account(request.user)
        return has_admin_role(request.user)
