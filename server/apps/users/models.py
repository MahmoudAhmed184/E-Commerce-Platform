from __future__ import annotations

import uuid
from datetime import timedelta

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone


class CustomUserManager(BaseUserManager):
    def create_user(
        self,
        email: str,
        password: str | None = None,
        full_name: str = "",
        phone: str | None = None,
        **extra_fields: object,
    ) -> "CustomUser":
        if not email:
            raise ValueError("The email field is required.")
        if not full_name:
            raise ValueError("The full_name field is required.")

        user = self.model(
            email=self.normalize_email(email),
            full_name=full_name,
            phone=phone or None,
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email: str,
        password: str | None = None,
        full_name: str = "",
        phone: str | None = None,
        **extra_fields: object,
    ) -> "CustomUser":
        extra_fields.setdefault("role", CustomUser.Role.ADMIN)
        extra_fields.setdefault("status", CustomUser.Status.ACTIVE)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_email_confirmed", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        if extra_fields.get("role") != CustomUser.Role.ADMIN:
            raise ValueError("Superuser must have role=admin.")

        return self.create_user(email, password, full_name, phone, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        ADMIN = "admin", "Admin"

    class Status(models.TextChoices):
        PENDING = "pending_approval", "Pending approval"
        ACTIVE = "active", "Active"
        RESTRICTED = "restricted", "Restricted"
        DELETED = "soft_deleted", "Soft deleted"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True, db_index=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_email_confirmed = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["email"], name="unique_user_email"),
            models.UniqueConstraint(fields=["phone"], name="unique_user_phone"),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.email


class EmailConfirmationToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["token"], name="unique_email_confirmation_token"),
        ]
        ordering = ["-created_at"]

    def save(self, *args: object, **kwargs: object) -> None:
        if self.expires_at is None:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Email confirmation token for {self.user_id}"
