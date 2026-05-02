from __future__ import annotations

from .models import CustomUser


def get_user_by_email(email: str) -> CustomUser | None:
    return CustomUser.objects.filter(email__iexact=email.strip()).first()


def get_user_by_phone(phone: str) -> CustomUser | None:
    return CustomUser.objects.filter(phone=phone.strip()).first()


def get_current_user_data(user: CustomUser) -> dict[str, object]:
    current_user = CustomUser.objects.only(
        "id",
        "email",
        "phone",
        "full_name",
        "role",
        "status",
        "is_email_confirmed",
    ).get(id=user.id)

    # SRS-GAP: task text defines CurrentUserSerializer without is_email_confirmed,
    # but SRS FR-USR-013 requires /api/v1/users/me/ to expose email confirmation state.
    return {
        "id": current_user.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "status": current_user.status,
        "is_email_confirmed": current_user.is_email_confirmed,
    }
