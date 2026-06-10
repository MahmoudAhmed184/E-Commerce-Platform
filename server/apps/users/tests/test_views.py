import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import CustomUser, EmailConfirmationToken


@pytest.fixture(autouse=True)
def clear_cache() -> None:
    cache.clear()


def _create_active_user(
    email: str = "active@example.com",
    phone: str = "+201000000100",
    password: str = "Password123",
) -> CustomUser:
    user = CustomUser.objects.create_user(
        email=email,
        phone=phone,
        password=password,
        full_name="Active User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )
    return user


def _login(client: APIClient, identifier: str, password: str = "Password123"):
    return client.post(
        "/api/v1/auth/login/",
        {"identifier": identifier, "password": password},
        format="json",
    )


@pytest.mark.django_db
def test_register_returns_201() -> None:
    client = APIClient()

    response = client.post(
        "/api/v1/auth/register/",
        {
            "email": "register@example.com",
            "phone": "+201000000010",
            "password": "Password123",
            "full_name": "Register User",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data == {"message": "Confirmation email sent."}
    assert CustomUser.objects.filter(email="register@example.com").exists()


@pytest.mark.django_db
def test_register_duplicate_email_returns_400() -> None:
    CustomUser.objects.create_user(
        email="duplicate-view@example.com",
        phone="+201000000011",
        password="Password123",
        full_name="Duplicate View",
    )
    client = APIClient()

    response = client.post(
        "/api/v1/auth/register/",
        {
            "email": "duplicate-view@example.com",
            "phone": "+201000000012",
            "password": "Password123",
            "full_name": "Duplicate View Again",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "email" in response.data


@pytest.mark.django_db
def test_register_missing_phone_returns_400() -> None:
    client = APIClient()

    response = client.post(
        "/api/v1/auth/register/",
        {
            "email": "missing-phone@example.com",
            "password": "Password123",
            "full_name": "Missing Phone",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "phone" in response.data


@pytest.mark.django_db
def test_confirm_email_valid_token() -> None:
    user = CustomUser.objects.create_user(
        email="confirm-view@example.com",
        phone="+201000000013",
        password="Password123",
        full_name="Confirm View",
    )
    token = EmailConfirmationToken.objects.create(user=user)
    client = APIClient()

    response = client.post(
        "/api/v1/auth/confirm-email/",
        {"token": str(token.token)},
        format="json",
    )
    user.refresh_from_db()

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {"message": "Email confirmed."}
    assert user.status == CustomUser.Status.ACTIVE
    assert user.is_email_confirmed is True


@pytest.mark.django_db
def test_confirm_email_without_trailing_slash() -> None:
    user = CustomUser.objects.create_user(
        email="confirm-view-no-slash@example.com",
        phone="+201000000113",
        password="Password123",
        full_name="Confirm View No Slash",
    )
    token = EmailConfirmationToken.objects.create(user=user)
    client = APIClient()

    response = client.post(
        "/api/v1/auth/confirm-email",
        {"token": str(token.token)},
        format="json",
    )
    user.refresh_from_db()

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {"message": "Email confirmed."}
    assert user.status == CustomUser.Status.ACTIVE
    assert user.is_email_confirmed is True


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_BASE_URL="http://frontend.test",
)
@pytest.mark.django_db
def test_password_reset_request_returns_generic_response_and_sends_email() -> None:
    user = _create_active_user(email="reset-request@example.com", phone="+201000000114")
    client = APIClient()

    response = client.post(
        "/api/v1/auth/password-reset/",
        {"email": user.email},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "message": "If an account exists for this email, a password reset link has been sent."
    }
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == [user.email]


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
@pytest.mark.django_db
def test_password_reset_request_hides_unknown_email() -> None:
    client = APIClient()

    response = client.post(
        "/api/v1/auth/password-reset/",
        {"email": "missing@example.com"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "message": "If an account exists for this email, a password reset link has been sent."
    }
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_password_reset_confirm_changes_password() -> None:
    user = _create_active_user(email="reset-confirm@example.com", phone="+201000000115")
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    client = APIClient()

    response = client.post(
        "/api/v1/auth/password-reset/confirm/",
        {
            "uid": uid,
            "token": token,
            "new_password": "ChangedPassword456",
            "confirm_password": "ChangedPassword456",
        },
        format="json",
    )
    user.refresh_from_db()

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {"message": "Password has been reset."}
    assert user.check_password("ChangedPassword456")


@pytest.mark.django_db
def test_password_reset_confirm_rejects_password_mismatch() -> None:
    user = _create_active_user(email="reset-mismatch@example.com", phone="+201000000116")
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    client = APIClient()

    response = client.post(
        "/api/v1/auth/password-reset/confirm/",
        {
            "uid": uid,
            "token": token,
            "new_password": "ChangedPassword456",
            "confirm_password": "DifferentPassword789",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["confirm_password"] == ["Passwords do not match."]


@pytest.mark.django_db
def test_login_with_email_returns_tokens() -> None:
    user = _create_active_user(email="login-email@example.com", phone="+201000000014")
    client = APIClient()

    response = _login(client, user.email)

    assert response.status_code == status.HTTP_200_OK
    assert set(response.data) == {"access", "refresh", "user"}
    assert response.data["user"]["email"] == user.email


@pytest.mark.django_db
def test_login_with_phone_returns_tokens() -> None:
    user = _create_active_user(email="login-phone@example.com", phone="+201000000015")
    assert user.phone is not None
    client = APIClient()

    response = _login(client, user.phone)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["access"]
    assert response.data["refresh"]
    assert response.data["user"]["phone"] == user.phone


@pytest.mark.django_db
def test_login_pending_user_returns_403() -> None:
    user = CustomUser.objects.create_user(
        email="pending-login@example.com",
        phone="+201000000016",
        password="Password123",
        full_name="Pending User",
    )
    client = APIClient()

    response = _login(client, user.email)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data == {
        "detail": "Please confirm your email before logging in.",
        "code": "email_confirmation_required",
        "account_status": CustomUser.Status.PENDING,
    }


@pytest.mark.django_db
def test_login_restricted_user_returns_403() -> None:
    user = _create_active_user(email="restricted-login@example.com", phone="+201000000017")
    user.status = CustomUser.Status.RESTRICTED
    user.save(update_fields=["status", "updated_at"])
    client = APIClient()

    response = _login(client, user.email)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data == {
        "detail": "Your account has been restricted. Contact support.",
        "code": "account_restricted",
        "account_status": CustomUser.Status.RESTRICTED,
    }


@pytest.mark.django_db
def test_login_deleted_user_returns_403() -> None:
    user = _create_active_user(email="deleted-login@example.com", phone="+201000000018")
    user.status = CustomUser.Status.DELETED
    user.deleted_at = timezone.now()
    user.save(update_fields=["status", "deleted_at", "updated_at"])
    client = APIClient()

    response = _login(client, user.email)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data == {
        "detail": "This account no longer exists.",
        "code": "account_deleted",
        "account_status": CustomUser.Status.DELETED,
    }


@pytest.mark.django_db
def test_logout_blacklists_token() -> None:
    user = _create_active_user(email="logout@example.com", phone="+201000000019")
    client = APIClient()
    login_response = _login(client, user.email)
    refresh = login_response.data["refresh"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    logout_response = client.post("/api/v1/auth/logout/", {"refresh": refresh}, format="json")
    refresh_response = client.post("/api/v1/auth/token/refresh/", {"refresh": refresh}, format="json")

    assert logout_response.status_code == status.HTTP_200_OK
    assert logout_response.data == {"message": "Logged out."}
    assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_refresh_token_rotates() -> None:
    user = _create_active_user(email="refresh@example.com", phone="+201000000020")
    client = APIClient()
    login_response = _login(client, user.email)
    refresh = login_response.data["refresh"]

    response = client.post("/api/v1/auth/token/refresh/", {"refresh": refresh}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["access"]
    assert response.data["refresh"]
    assert response.data["refresh"] != refresh


@pytest.mark.django_db
def test_me_returns_current_user_shape() -> None:
    user = _create_active_user(email="me@example.com", phone="+201000000021")
    client = APIClient()
    login_response = _login(client, user.email)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    response = client.get("/api/v1/users/me/")

    assert response.status_code == status.HTTP_200_OK
    assert set(response.data) == {
        "id",
        "email",
        "phone",
        "full_name",
        "role",
        "status",
        "is_email_confirmed",
    }
    assert str(response.data["id"]) == str(user.id)
    assert response.data["email"] == user.email
    assert response.data["is_email_confirmed"] is True


@pytest.mark.django_db
def test_me_unauthenticated_returns_401() -> None:
    client = APIClient()

    response = client.get("/api/v1/users/me/")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_me_patch_updates_profile() -> None:
    user = _create_active_user(email="me-patch@example.com", phone="+201000000022")
    client = APIClient()
    login_response = _login(client, user.email)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    response = client.patch(
        "/api/v1/users/me/",
        {"full_name": "Updated User", "phone": "+201000000023"},
        format="json",
    )
    user.refresh_from_db()

    assert response.status_code == status.HTTP_200_OK
    assert response.data["full_name"] == "Updated User"
    assert response.data["phone"] == "+201000000023"
    assert user.full_name == "Updated User"
    assert user.phone == "+201000000023"


@pytest.mark.django_db
def test_me_password_changes_authenticated_user_password() -> None:
    user = _create_active_user(email="me-password@example.com", phone="+201000000123")
    client = APIClient()
    login_response = _login(client, user.email)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    response = client.post(
        "/api/v1/users/me/password/",
        {
            "current_password": "Password123",
            "new_password": "ChangedPassword456",
            "confirm_password": "ChangedPassword456",
        },
        format="json",
    )
    user.refresh_from_db()

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {"message": "Password has been changed."}
    assert user.check_password("ChangedPassword456")
    assert not user.check_password("Password123")


@pytest.mark.django_db
def test_me_password_rejects_wrong_current_password() -> None:
    user = _create_active_user(email="me-password-wrong@example.com", phone="+201000000124")
    client = APIClient()
    login_response = _login(client, user.email)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    response = client.post(
        "/api/v1/users/me/password/",
        {
            "current_password": "WrongPassword123",
            "new_password": "ChangedPassword456",
            "confirm_password": "ChangedPassword456",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["current_password"] == ["Current password is incorrect."]


@pytest.mark.django_db
def test_me_password_rejects_mismatched_confirmation() -> None:
    user = _create_active_user(email="me-password-mismatch@example.com", phone="+201000000125")
    client = APIClient()
    login_response = _login(client, user.email)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    response = client.post(
        "/api/v1/users/me/password/",
        {
            "current_password": "Password123",
            "new_password": "ChangedPassword456",
            "confirm_password": "DifferentPassword789",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["confirm_password"] == ["Passwords do not match."]


@pytest.mark.django_db
def test_me_password_unauthenticated_returns_401() -> None:
    client = APIClient()

    response = client.post(
        "/api/v1/users/me/password/",
        {
            "current_password": "Password123",
            "new_password": "ChangedPassword456",
            "confirm_password": "ChangedPassword456",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_me_patch_duplicate_phone_returns_400() -> None:
    CustomUser.objects.create_user(
        email="other-user@example.com",
        phone="+201000000024",
        password="Password123",
        full_name="Other User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )
    user = _create_active_user(email="me-duplicate@example.com", phone="+201000000025")
    client = APIClient()
    login_response = _login(client, user.email)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    response = client.patch(
        "/api/v1/users/me/",
        {"phone": "+201000000024"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data == {"phone": ["A user with this phone already exists."]}


@pytest.mark.django_db
def test_me_patch_without_fields_returns_400() -> None:
    user = _create_active_user(email="me-empty@example.com", phone="+201000000026")
    client = APIClient()
    login_response = _login(client, user.email)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    response = client.patch("/api/v1/users/me/", {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data == {"non_field_errors": ["Provide at least one field to update."]}


@pytest.mark.django_db
def test_register_throttle_triggers_after_10_requests() -> None:
    client = APIClient()

    for attempt in range(11):
        response = client.post(
            "/api/v1/auth/register/",
            {
                "email": f"throttle-{attempt}@example.com",
                "phone": f"+2010000002{attempt:02d}",
                "password": "Password123",
                "full_name": "Throttle User",
            },
            format="json",
        )

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
