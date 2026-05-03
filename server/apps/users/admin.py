from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, EmailConfirmationToken


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ("email", "full_name", "phone", "role", "status", "is_staff")
    list_filter = ("role", "status", "is_staff", "is_email_confirmed")
    search_fields = ("email", "phone", "full_name")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name", "phone")}),
        ("Application state", {"fields": ("role", "status", "is_email_confirmed", "deleted_at")}),
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


@admin.register(EmailConfirmationToken)
class EmailConfirmationTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "is_used", "created_at", "expires_at")
    list_filter = ("is_used", "created_at", "expires_at")
    search_fields = ("user__email", "user__phone", "token")
    readonly_fields = ("created_at",)
