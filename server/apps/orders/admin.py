from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_name", "product_slug", "unit_price", "quantity", "line_total")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "email", "status", "payment_status", "total_amount", "created_at")
    list_filter = ("status", "payment_status", "created_at")
    search_fields = ("order_number", "email", "phone")
    readonly_fields = ("order_number", "created_at", "updated_at")
    inlines = [OrderItemInline]
