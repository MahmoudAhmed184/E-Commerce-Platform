from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "user", "rating", "is_visible", "created_at")
    list_filter = ("rating", "is_visible", "created_at")
    search_fields = ("product__name", "user__email", "user__full_name", "comment")
