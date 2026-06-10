from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, EmailConfirmationToken


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ("email", "full_name", "phone", "role", "status", "is_active", "is_staff")
    list_filter = ("role", "status", "is_active", "is_staff", "is_email_confirmed")
    search_fields = ("email", "phone", "full_name")
    ordering = ("email",)
    actions = ["approve_users", "activate_users"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name", "phone")}),
        ("Application state", {"fields": ("role", "status", "is_email_confirmed", "deleted_at")} ),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    readonly_fields = ("created_at", "updated_at")
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "phone", "password1", "password2"),
            },
        ),
    )

    def approve_users(self, request, queryset):
        updated = queryset.update(
            status=CustomUser.Status.ACTIVE,
            is_email_confirmed=True,
            is_active=True,
        )
        self.message_user(
            request,
            f"{updated} user{'s' if updated != 1 else ''} marked as active.",
        )

    approve_users.short_description = "Approve selected users and make them active"

    def activate_users(self, request, queryset):
        updated = queryset.update(
            status=CustomUser.Status.ACTIVE,
            is_active=True,
            is_email_confirmed=True,
            deleted_at=None,
        )
        self.message_user(
            request,
            f"{updated} user{'s' if updated != 1 else ''} restored to active status.",
        )

    activate_users.short_description = "Activate selected users"


@admin.register(EmailConfirmationToken)
class EmailConfirmationTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "is_used", "created_at", "expires_at")
    list_filter = ("is_used", "created_at", "expires_at")
    search_fields = ("user__email", "user__phone", "token")
    readonly_fields = ("created_at",)
