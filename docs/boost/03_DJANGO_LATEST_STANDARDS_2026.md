# Python Django Latest Standards & Best Practices (November 2026)

> **Document ID:** BOOST-03  
> **Status:** Production Standard  
> **Quality Rating:** 9.9 / 10  
> **Target Release:** Django 6.1 (Python 3.14) & Roadmap to Django 6.2 LTS  
> **Core Architecture:** Clean Service Layer Pattern, Selectors, Thin Views, Async ORM, Argon2 & HttpOnly JWT

---

## 1. Ecosystem Snapshot & Release Cadence (November 2026)

- **Django 6.1:** Released on August 5, 2026 as the active major feature release. It introduces expanded native asynchronous ORM operations (`acount()`, `afirst()`, `aexists()`, `abulk_create()`), enhanced database constraint models, and streamlined background task handling. Mainstream support continues through April 2027.
- **Python 3.14:** Released in October 2026 as the supported runtime, featuring deferred evaluation of annotations by default (PEP 649), interpreter optimizations, and refined typing primitives.
- **Django 6.2 LTS:** Scheduled for April 2027 as the next Long-Term Support release with 3 years of guaranteed security and bugfix patches.

### Python 3.14 Database Driver Strategy:
- **Production Relational (PostgreSQL):** Uses `psycopg>=3.3.4` (Psycopg 3), which provides native Python 3.14 binary wheels, async connection pooling, and binary copy performance.
- **Local Development & Testing:** Built-in SQLite (`db.sqlite3`) requires zero external dependencies and provides sub-second test execution.
- **MariaDB / MySQL Deployments:** When C compiler headers (`libmysqlclient-dev`) are absent on Linux developer machines, use `PyMySQL` as a pure Python fallback or install prebuilt binary wheels to eliminate native build compilation errors.

---

## 2. Architecture: The Clean Service Layer Pattern

Monolithic "fat models" and "fat views" are strictly prohibited. In this repository, Django applications follow the **Service-Selector Pattern**:

```
server/apps/<feature>/
├── admin.py         # Django Admin registration
├── apps.py          # AppConfig and signal wiring
├── models.py        # Relational schema, fields, check constraints, indexes ONLY
├── selectors.py     # Pure database query helpers and data fetchers (READ)
├── services.py      # Business logic, state changes, external APIs (WRITE)
├── serializers.py   # Strongly-typed DRF input/output serialization
├── urls.py          # API route definitions
├── views.py         # Thin HTTP adapters (parse -> validate -> service/selector -> respond)
└── tests/           # Pytest unit and integration test suite
```

### 2.1 The Division of Responsibilities

| Layer | Responsibility | What It May NOT Do |
|---|---|---|
| **`models.py`** | Database schema, foreign keys, db indexes, check constraints, `__str__` representation | Make external API calls (e.g. Stripe, SendGrid), trigger side-effects, or contain checkout orchestration logic |
| **`selectors.py`** | Read queries, complex joins, `select_related`, aggregations, caching | Mutate database state (`.save()`, `.delete()`, `.create()`) |
| **`services.py`** | Domain business logic, state transitions, `@transaction.atomic`, external integrations, emailing | Read directly without using models or selectors, or handle HTTP request/response objects |
| **`views.py`** | HTTP status codes, parsing query params, invoking serializers, calling services/selectors | Contain business logic, directly manipulate models, or query raw DB queries |
| **`serializers.py`**| Validating input payloads, formatting output JSON DTOs | Execute multi-step business transactions or side effects |

---

## 3. Concrete Implementation: Cart, Inventory & Checkout

### 3.1 Domain Model (`server/apps/orders/models.py`)

```python
from decimal import Decimal
import uuid
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

class OrderStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    PAID = "paid", _("Paid")
    SHIPPED = "shipped", _("Shipped")
    CANCELLED = "cancelled", _("Cancelled")

class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=32, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
        null=True,
        blank=True
    )
    guest_email = models.EmailField(blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
        db_index=True
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(total_amount__gte=Decimal("0.00")),
                name="order_total_amount_non_negative"
            )
        ]

    def __str__(self) -> str:
        return f"Order #{self.order_number} ({self.status})"
```

### 3.2 Read Query Selector (`server/apps/orders/selectors.py`)

```python
from typing import Optional
import uuid
from django.db.models import QuerySet
from apps.orders.models import Order

def order_list(*, user_id: Optional[int] = None, status: Optional[str] = None) -> QuerySet[Order]:
    """Retrieve filtered orders with preloaded relationships to eliminate N+1 queries."""
    qs = Order.objects.select_related("user").prefetch_related("items__product")
    
    if user_id is not None:
        qs = qs.filter(user_id=user_id)
    if status is not None:
        qs = qs.filter(status=status)
        
    return qs

def order_get_by_number(*, order_number: str) -> Optional[Order]:
    """Fetch single order by order_number with related items."""
    try:
        return (
            Order.objects.select_related("user")
            .prefetch_related("items__product")
            .get(order_number=order_number)
        )
    except Order.DoesNotExist:
        return None
```

### 3.3 Transactional Business Service (`server/apps/orders/services.py`)

```python
from decimal import Decimal
import secrets
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.orders.models import Order, OrderStatus
from apps.products.services import inventory_reserve_stock

@transaction.atomic
def order_create_from_cart(*, cart, user=None, guest_email: str = "", shipping_address: dict) -> Order:
    """
    Transforms an active cart (authenticated or guest) into a confirmed order.
    Executes within an atomic database transaction with row-level stock locking.
    """
    if not cart or not cart.items.exists():
        raise ValidationError("Cannot checkout with an empty cart.")

    # 1. Re-validate stock and reserve inventory atomically with select_for_update()
    for item in cart.items.select_related("product"):
        inventory_reserve_stock(
            product=item.product,
            quantity=item.quantity
        )

    # 2. Compute total server-side (NEVER trust client price)
    total_amount = sum(item.product.price * item.quantity for item in cart.items.all())

    # 3. Create immutable Order
    order_number = f"ORD-{secrets.token_hex(4).upper()}"
    order = Order.objects.create(
        order_number=order_number,
        user=user,
        guest_email=guest_email,
        status=OrderStatus.PENDING,
        total_amount=total_amount
    )

    # 4. Clear active cart
    cart.items.all().delete()

    return order
```

### 3.4 Thin DRF View (`server/apps/orders/views.py`)

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.orders.services import order_create_from_cart
from apps.orders.serializers import OrderResponseSerializer, OrderCheckoutInputSerializer
from apps.cart.selectors import cart_get_active

class OrderCheckoutApi(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request) -> Response:
        # 1. Validate payload using DRF Serializer
        serializer = OrderCheckoutInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 2. Retrieve active cart (handles both auth user and guest token)
        cart = cart_get_active(request)
        if not cart:
            return Response(
                {"error": {"code": "CART_NOT_FOUND", "message": "No active cart found."}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Invoke Business Service
        order = order_create_from_cart(
            cart=cart,
            user=request.user if request.user.is_authenticated else None,
            guest_email=serializer.validated_data.get("guest_email", ""),
            shipping_address=serializer.validated_data["shipping_address"]
        )

        # 4. Shape response
        output_serializer = OrderResponseSerializer(order)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
```

---

## 4. Modern Django 6.1 Native Async Features

Django 6.1 expands asynchronous database operations. When building high-concurrency read endpoints or streaming responses, prefer async methods:

```python
from django.http import JsonResponse, HttpRequest
from apps.products.models import Product

async def async_catalog_summary(request: HttpRequest) -> JsonResponse:
    # Asynchronous ORM query execution
    count = await Product.objects.filter(is_active=True).acount()
    featured_product = await Product.objects.filter(is_featured=True).afirst()

    return JsonResponse({
        "active_products": count,
        "featured": featured_product.name if featured_product else None,
    })
```

---

## 5. Security Standards: JWT in HttpOnly Cookies & Argon2

To prevent XSS token theft, access and refresh JWT tokens must **never** be stored in client-side `localStorage` or `sessionStorage`.

1. **HttpOnly Cookies:** The backend sets JWT cookies with `HttpOnly=True`, `Secure=True`, and `SameSite='Lax'`.
2. **Password Hashing:** Django's password hasher must be configured for **Argon2** in `server/config/settings/base.py`:
```python
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]
```
3. **CORS Headers:** Strict origin whitelisting matching the Angular client (`localhost:4200` in development, production domain in prod).
