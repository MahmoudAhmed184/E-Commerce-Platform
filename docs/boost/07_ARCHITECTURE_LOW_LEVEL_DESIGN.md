# Low-Level System Architecture Design (LLD - 2026)

> **Document ID:** BOOST-07  
> **Status:** Production Standard  
> **Quality Rating:** 9.9 / 10  
> **Target Release:** Angular 22 Client & Django 6.1 Backend  
> **Design Artifacts:** Directory Trees, Typed Signal Stores, Service Layer, Exception Handlers

---

## 1. Frontend Low-Level Design (Angular 22)

### 1.1 Complete Client Directory Tree

```
client/src/app/
├── core/
│   ├── guards/               # Functional route guards (authGuard, adminGuard)
│   ├── interceptors/         # Functional HTTP interceptors (authInterceptor, apiVersionInterceptor)
│   ├── models/               # Domain interfaces, API DTOs, Enums, runtime validation
│   └── services/             # Singleton services (AuthService, CartService, ThemeService)
├── shared/
│   ├── components/
│   │   ├── spartan/          # Spartan UI primitives (Helm directives & Brain wrappers)
│   │   │   ├── button/
│   │   │   ├── input/
│   │   │   ├── label/
│   │   │   ├── sheet/
│   │   │   ├── dialog/
│   │   │   ├── dropdown-menu/
│   │   │   ├── sonner/
│   │   │   ├── tabs/
│   │   │   ├── table/
│   │   │   └── badge/
│   │   ├── empty-state/      # Presentational empty states
│   │   ├── search-bar/       # Global search input control
│   │   └── button-group/     # Segmented button controls
│   ├── directives/           # Reusable behavioral directives
│   └── pipes/                # Formatters (currency, date, truncate)
├── layout/
│   ├── global-nav/           # Top sticky navigation, brand, search, cart badge
│   ├── footer/               # Footer links and copyright
│   └── theme-toggle/         # Dark / Light mode toggle button
└── features/
    ├── auth/                 # Login, Register, Email Confirm pages & facades
    ├── products/             # Home, Catalog, Product Detail pages & cards
    ├── cart/                 # Slide-over cart drawer & Cart review page
    ├── checkout/             # Address, Delivery, Payment, Order Review steps
    ├── orders/               # Order history & confirmation screens
    ├── reviews/              # Product review submission & list
    └── admin/                # Staff dashboard, product management, user tables
```

### 1.2 Reactive Signal Store Architecture (Cart Store Example)

Rather than introducing bulky third-party libraries (NgRx Store), domain state is managed using high-performance, strongly typed **Angular Signal Stores**:

```typescript
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toast } from 'ngx-sonner';

export interface CartItem {
  readonly productId: string;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
  readonly imageUrl: string;
  readonly maxStock: number;
}

interface CartState {
  readonly items: CartItem[];
  readonly isDrawerOpen: boolean;
  readonly isSyncing: boolean;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);

  // Private Writable Signal (Single Source of Truth)
  private readonly _state = signal<CartState>({
    items: [],
    isDrawerOpen: false,
    isSyncing: false,
  });

  // Public Readonly Signals (Derived & Selectors)
  readonly items = computed(() => this._state().items);
  readonly isDrawerOpen = computed(() => this._state().isDrawerOpen);
  readonly isSyncing = computed(() => this._state().isSyncing);

  readonly itemCount = computed(() =>
    this._state().items.reduce((acc, item) => acc + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this._state().items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  );

  // Actions / Mutations
  setDrawerOpen(open: boolean): void {
    this._state.update(s => ({ ...s, isDrawerOpen: open }));
  }

  addItem(item: Omit<CartItem, 'quantity'>, quantity = 1): void {
    this._state.update(state => {
      const existingIndex = state.items.findIndex(i => i.productId === item.productId);
      let updatedItems: CartItem[];

      if (existingIndex > -1) {
        const existing = state.items[existingIndex]!;
        const newQty = Math.min(existing.quantity + quantity, existing.maxStock);
        updatedItems = state.items.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: newQty } : it
        );
      } else {
        updatedItems = [...state.items, { ...item, quantity: Math.min(quantity, item.maxStock) }];
      }

      return { ...state, items: updatedItems, isDrawerOpen: true };
    });

    toast.success('Added to Bag', { description: `${item.name} is in your cart.` });
  }

  removeItem(productId: string): void {
    this._state.update(state => ({
      ...state,
      items: state.items.filter(i => i.productId !== productId),
    }));
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    this._state.update(state => ({
      ...state,
      items: state.items.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.min(quantity, item.maxStock) }
          : item
      ),
    }));
  }
}
```

---

## 2. Backend Low-Level Design (Django 6.1)

### 2.1 Complete Server Directory Tree

```
server/
├── apps/
│   ├── users/                # Custom User, authentication, profile, tokens
│   ├── products/             # Category, Product, ProductImage, Review aggregation
│   ├── cart/                 # Cart, CartItem, GuestToken selectors & services
│   ├── orders/               # Order, OrderItem, Address, OrderSummary
│   ├── payments/             # Payment, Sandbox provider, Webhook dispatchers
│   ├── reviews/              # Review, rating calculation, verified buyer checks
│   └── admin_ops/            # Staff operations, metrics, catalog administration
├── config/
│   ├── settings/
│   │   ├── base.py           # Shared settings, apps, auth, password hashers
│   │   ├── development.py    # Local SQLite, debug toolbar, relaxed CORS
│   │   ├── testing.py        # In-memory DB, fast password hashers, clean state
│   │   └── production.py     # Hardened security, Postgres, SSL, strict cookies
│   ├── exceptions.py         # Standardized DRF exception handler
│   ├── urls.py               # Root API routing (/api/v1/)
│   └── wsgi.py / asgi.py     # ASGI entrypoint for async Django 6.1
├── manage.py
└── pyproject.toml
```

### 2.2 Uniform API Response & Error Schema (`server/config/exceptions.py`)

All REST API endpoints produce consistent, predictable JSON responses conforming to `docs/api_contract.md`:

```python
from typing import Any, Dict, Optional
from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_api_exception_handler(exc: Exception, context: Dict[str, Any]) -> Optional[Response]:
    """
    Normalizes errors into the canonical contract format:
    {
      "error": {
        "code": "VALIDATION_FAILED",
        "message": "Human readable summary",
        "details": [...]
      }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        standardized_error = {
            "error": {
                "code": exc.__class__.__name__.upper(),
                "status": response.status_code,
                "message": str(exc),
                "details": response.data,
            }
        }
        response.data = standardized_error

    return response
```

### 2.3 Row-Level Concurrency Protection (`server/apps/products/services.py`)

```python
from django.db import transaction
from apps.products.models import Product

class InsufficientStockError(Exception):
    def __init__(self, product_name: str, available: int, requested: int):
        super().__init__(
            f"Insufficient stock for '{product_name}'. Requested {requested}, available: {available}."
        )
        self.available = available
        self.requested = requested

@transaction.atomic
def inventory_reserve_stock(*, product: Product, quantity: int) -> Product:
    """
    Acquires an exclusive row lock (select_for_update) on the product record,
    verifies stock availability, and decrements atomically.
    """
    locked_product = Product.objects.select_for_update().get(id=product.id)

    if locked_product.stock_quantity < quantity:
        raise InsufficientStockError(
            product_name=locked_product.name,
            available=locked_product.stock_quantity,
            requested=quantity
        )

    locked_product.stock_quantity -= quantity
    locked_product.save(update_fields=["stock_quantity", "updated_at"])
    return locked_product
```
