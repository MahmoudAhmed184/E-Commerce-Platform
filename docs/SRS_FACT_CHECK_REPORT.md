# SRS Fact Check Report

Date: 2026-05-17

Source document checked: `docs/SRS.md`

Project checked: Django/DRF backend under `server/` and Angular frontend under `client/`.

## Method

- Read the SRS, API contract, requirements checklist, README, backend apps, frontend feature code, settings, routes, models, serializers, services, and tests.
- Compared SRS functional requirements, non-functional requirements, architecture, data model, API map, and Angular/Django module maps against the current implementation.
- Ran verification commands from the repository where practical.
- Did not use external web sources because this is an internal project/codebase fact check.

Pre-existing working tree note: `git status --short` showed deleted docs before this report was created:

```text
D docs/GITHUB_SETUP.md
D docs/developer_2_plan.md
D docs/payment_checkout_handoff.md
```

Those files were not modified by this fact check.

## Status Legend

| Status | Meaning |
|---|---|
| Verified | The SRS claim matches the current code closely enough for the stated acceptance criteria. |
| Partial | The feature exists but is incomplete, inconsistent across backend/frontend/docs, or misses part of the acceptance criteria. |
| Not implemented | I did not find code implementing the claim. |
| Inaccurate | The SRS states something contradicted by the current project. |
| Not verifiable | The claim depends on external repository settings, deployment, benchmarking, or history not available in this checkout. |

## Executive Summary

The SRS is broadly aligned with the intended e-commerce scope, and the project implements more than the older `docs/requirements.md` checklist suggests. Auth, product catalog, cart, checkout, COD/wallet/sandbox card payments, admin APIs, and reviews all exist in the current code.

However, the SRS is not fully factually accurate against the current project. The largest issues are:

1. The SRS says PostgreSQL is the primary/default database, but `server/config/settings/base.py` defaults to MySQL/MariaDB (`django.db.backends.mysql`) and only includes `psycopg` as an available dependency.
2. The SRS says card payment is through Stripe or PayPal, but the implementation creates `sandbox_...` provider references and uses a sandbox HMAC webhook, not Stripe/PayPal.
3. The SRS data model says most IDs are UUIDs and uses fields like `stock_quantity`, `Cart.status`, `Payment.provider`, `Payment.confirmed_at`, and `WalletTransaction`; the implementation uses integer IDs for most domain models, `Product.stock`, a one-to-one cart with no status, a one-to-one payment with no provider/confirmed timestamp, and `WalletLedgerEntry`.
4. Cart conversion after authenticated checkout does not match the SRS. The SRS says the cart is marked converted; the code deletes cart items and the `Cart` model has no lifecycle status.
5. Product/category delete semantics are inconsistent. The SRS/API table says `DELETE` deactivates products and categories, but the DRF `ModelViewSet` default `DELETE` hard-deletes; deactivation is implemented as a custom `POST .../deactivate/` action.
6. Review APIs are implemented, but backend tests currently fail around review list response shape and delete semantics. The Angular review service also expects an array while the backend review list is paginated.
7. The Angular admin product page does not expose full product creation/update workflows promised by the SRS, even though backend admin product APIs exist.
8. CI is not implemented. There are GitHub templates and Dependabot config, but no `.github/workflows/` files.

## Verification Results

| Command | Result | Notes |
|---|---:|---|
| `uv run python manage.py check` | Pass | Django system check reported no issues. |
| `uv run pytest` | Command failed | The generated `.venv/bin/pytest` script has a stale shebang pointing to `/home/mahmoud-ahmed/Projects/ITI Projects/E-Commerce/server/.venv/bin/python3`. |
| `.venv/bin/python -m pytest` | Fail | 62 tests collected; 60 passed, 2 failed. |
| `npm run build` | Pass | Angular production build completed. |
| `npm test` | Pass | 10 test files and 27 tests passed. |
| `npm run lint` | Pass | Angular lint reported all files pass. |
| `.venv/bin/python manage.py check_auth_security` | Pass as a diagnostic command | Output confirms CORS/throttle/JWT settings; development security flags are false, while production settings enable HTTPS/HSTS. |

Backend test failures:

- `apps/reviews/tests/test_reviews_api.py::test_public_product_reviews_only_include_visible_reviews`
  - The test iterates `response.data` as if the endpoint returns a bare list.
  - The endpoint uses `ReviewPagination`, so the actual response is paginated (`count`, `next`, `previous`, `results`).
  - This is a test/API contract mismatch.
- `apps/reviews/tests/test_reviews_api.py::test_review_owner_can_update_and_delete_review`
  - The test expects the review row to be hard-deleted.
  - The implementation soft-deletes by setting `deleted_at`.
  - The SRS data model includes `Review.deleted_at`, so the implementation is defensible and the test appears stale unless product requirements require physical deletion.

## Functional Requirements Matrix

### User Management

| ID | Status | Fact check |
|---|---|---|
| FR-USR-001 | Verified | Registration requires email, phone, password, and full name in `RegisterSerializer`; user creation checks email and phone uniqueness in `server/apps/users/services.py:27-45`. |
| FR-USR-002 | Verified | Duplicate email is checked case-insensitively in `create_user()` at `server/apps/users/services.py:32-33`. |
| FR-USR-003 | Verified | Duplicate phone is checked in `create_user()` at `server/apps/users/services.py:34-35`. |
| FR-USR-004 | Verified | Registration creates `EmailConfirmationToken` and sends mail on transaction commit at `server/apps/users/services.py:43-63`. |
| FR-USR-005 | Verified | `confirm_email()` validates token, expiry, and used state, then marks the user confirmed/active at `server/apps/users/services.py:71-95`. |
| FR-USR-006 | Verified | `authenticate_user()` blocks non-active or unconfirmed users at `server/apps/users/services.py:135-140`. |
| FR-USR-007 | Verified | Login accepts an identifier and resolves email if it contains `@` at `server/apps/users/services.py:110-116`. |
| FR-USR-008 | Verified | Login resolves phone when the identifier is not an email at `server/apps/users/services.py:110-116`. |
| FR-USR-009 | Verified | `issue_auth_tokens()` returns access and refresh tokens at `server/apps/users/services.py:145-150`. |
| FR-USR-010 | Verified | `/api/v1/auth/token/refresh/` is wired to SimpleJWT in `server/apps/users/urls.py`. |
| FR-USR-011 | Verified | Logout blacklists submitted refresh tokens at `server/apps/users/services.py:153-157`. |
| FR-USR-012 | Partial | `CustomUser.Role` has only `customer` and `admin`, but backend admin permissions use DRF `IsAdminUser`, which checks `is_staff`, not the `role` field. A role/staff mismatch could break the SRS meaning of "Admin role". |
| FR-USR-013 | Partial | Backend `/users/me/` returns `is_email_confirmed` through `get_current_user_data()` at `server/apps/users/selectors.py:14-35`. The Angular `User` model and `AuthService.normalizeUser()` drop this field at `client/src/app/core/models/user.model.ts:4-11` and `client/src/app/core/services/auth.service.ts:138-146`, so the frontend does not fully expose it. |
| FR-USR-014 | Partial | Login is blocked for pending/restricted users at `server/apps/users/services.py:128-140`. Checkout does not re-check account status, so a user with a still-valid token after restriction could place an order through `OrderViewSet.checkout()`. |
| FR-USR-015 | Verified for login | Soft-deleted users are blocked from login at `server/apps/users/services.py:121-126`. Existing-token behavior is not explicitly handled. |

### Product Catalog

| ID | Status | Fact check |
|---|---|---|
| FR-PRD-001 | Partial | Product listing is paginated and active-only through `ProductViewSet` and `get_active_products()`, but the SRS API table lists `GET /api/v1/products/`; the actual route is `/api/v1/products/products/` because `config.urls` includes `apps.products.urls` under `/api/v1/products/` and the router registers `products`. |
| FR-PRD-002 | Verified | Product list serializer returns name, primary image, price, category, stock, availability, average rating, and review count at `server/apps/products/serializers.py:23-42`. |
| FR-PRD-003 | Partial | Detail serializer includes the requested detail fields at `server/apps/products/serializers.py:60-78`, but review aggregates count visible reviews without excluding soft-deleted reviews in `server/apps/products/selectors.py:24-30`. |
| FR-PRD-004 | Verified | `search_fields = ['name']` is configured at `server/apps/products/views.py:69-70`. |
| FR-PRD-005 | Verified | Category slug filtering is configured at `server/apps/products/views.py:69`. |
| FR-PRD-006 | Verified | `min_price` and `max_price` filters are applied at `server/apps/products/views.py:74-82`. |
| FR-PRD-007 | Verified | Search, category, price, and ordering are on the same `ProductViewSet`. |
| FR-PRD-008 | Verified with naming mismatch | Out-of-stock products remain visible when active, cart validation rejects over-stock quantities, and product detail disables add-to-cart for zero stock. The code uses `stock`, while the SRS names the field `stock_quantity`. |
| FR-PRD-009 | Verified | Images use `ImageField`, media storage settings, and URL serializers at `server/apps/products/models.py:77-86` and `server/apps/products/serializers.py:17-20`. |
| FR-PRD-010 | Partial | The model requires a `category` FK at `server/apps/products/models.py:33-36`, but `AdminProductSerializer.category_id` is `required=False` at `server/apps/products/serializers.py:121-126`, so missing-category create validation may not fail cleanly before database/model errors. |

### Cart

| ID | Status | Fact check |
|---|---|---|
| FR-CRT-001 | Verified | Authenticated cart item creation validates active product and stock at `server/apps/cart/services.py:16-31` and `server/apps/cart/services.py:61-65`. |
| FR-CRT-002 | Verified | Guest cart state is stored in Angular localStorage via `GUEST_CART_KEY` in `client/src/app/features/cart/services/cart.service.ts:35-139`. |
| FR-CRT-003 | Verified | Quantity update recalculates totals through model properties and service update at `server/apps/cart/services.py:34-43`. |
| FR-CRT-004 | Verified | Cart item removal deletes the line and returns the updated cart at `server/apps/cart/services.py:46-51`. |
| FR-CRT-005 | Partial | Authenticated cart add/update rejects quantities above stock. Guest cart can accumulate any quantity locally and is only rejected during checkout. |
| FR-CRT-006 | Partial | Authenticated cart responses include line totals, subtotal, and total. They do not include configured charges such as shipping/tax/discount. The `Cart.total` property simply returns `subtotal` at `server/apps/cart/models.py:17-23`. |

### Checkout and Orders

| ID | Status | Fact check |
|---|---|---|
| FR-CHK-001 | Partial | Angular checkout shows only subtotal before placement at `client/src/app/features/checkout/pages/checkout-page/checkout-page.ts:113-126`. It does not list items, charges, or final total, and there is no backend summary endpoint. |
| FR-CHK-002 | Verified | Authenticated checkout links the order to `request.user` when authenticated at `server/apps/orders/services.py:29-31`. |
| FR-CHK-003 | Verified | Guest checkout is public and stores `user=None` at `server/apps/orders/views.py:39-66` and `server/apps/orders/services.py:29-31`. |
| FR-CHK-004 | Verified | Checkout serializer requires email, phone, shipping address, payment method, and items at `server/apps/orders/serializers.py:23-28`. |
| FR-ORD-001 | Verified | `Order.save()` generates unique public order numbers at `server/apps/orders/models.py:22` and `server/apps/orders/models.py:55-58`. |
| FR-ORD-002 | Verified | Order items snapshot name, slug, unit price, quantity, and line total at `server/apps/orders/services.py:50-59`. |
| FR-ORD-003 | Verified | Checkout revalidates active product and stock under row lock at `server/apps/orders/services.py:42-49`. |
| FR-ORD-004 | Verified | Stock decrement happens inside `transaction.atomic()` with `select_for_update()` at `server/apps/orders/services.py:17-67`. |
| FR-ORD-005 | Inaccurate | SRS says the cart is marked converted. Current `Cart` has no `status`; checkout calls `clear_cart_for_user()` which deletes cart items at `server/apps/cart/services.py:54-58`. |
| FR-ORD-006 | Verified | Checkout response serializes order number, items, totals, status, and payment summary at `server/apps/orders/serializers.py:43-62`. |

### Payments

| ID | Status | Fact check |
|---|---|---|
| FR-PAY-001 | Inaccurate | The SRS says Stripe or PayPal. The implementation creates `sandbox_...` card references and exposes `/payments/webhooks/sandbox/`; no Stripe/PayPal SDK, provider config, or client continuation metadata was found. See `server/apps/payments/services.py:44-48`. |
| FR-PAY-002 | Verified | COD sets payment status to `cod_pending` and confirms the order at `server/apps/payments/services.py:30-34`. |
| FR-PAY-003 | Partial | Wallet payment debits an authenticated wallet if balance is sufficient at `server/apps/payments/services.py:36-42` and `server/apps/payments/services.py:53-72`. Funding/admin top-up workflows are not implemented. |
| FR-PAY-004 | Verified | Insufficient wallet balance raises validation error at `server/apps/payments/services.py:58-60`. |
| FR-PAY-005 | Partial | Checkout creates a `Payment` record, but the model is `OneToOneField` to `Order`, so multiple payment attempts per order are not supported. See `server/apps/payments/models.py:19`. |
| FR-PAY-006 | Partial | `Payment` stores method, amount, status, provider reference, payload, failure reason, and order, but it does not store the SRS `provider` field or `confirmed_at`. See `server/apps/payments/models.py:19-28`. |
| FR-PAY-007 | Partial | Sandbox webhook signatures are verified with HMAC at `server/apps/payments/views.py:21-29`; this is not Stripe/PayPal signature verification. |
| FR-PAY-008 | Partial | Card orders remain pending until signed webhook success, and failed webhooks mark payment/order failed at `server/apps/payments/services.py:96-106`. There is no `cancelled` payment status and no retry/recovery workflow because payment is one-to-one with order. |
| FR-PAY-009 | Verified | Checkout only accepts `payment_method`; no raw card number/CVV fields are modeled or persisted. |
| FR-PAY-010 | Verified | Payment amount is set from `order.total_amount` at `server/apps/payments/services.py:23-27`, not from client input. |

### Admin

| ID | Status | Fact check |
|---|---|---|
| FR-ADM-001 | Verified | Admin users endpoint is paginated at `server/apps/admin/views.py:19-28`. |
| FR-ADM-002 | Verified | Admin user search checks email, phone, and full name at `server/apps/admin/views.py:30-39`. |
| FR-ADM-003 | Verified | Admin approval sets status active and email confirmed at `server/apps/admin/views.py:41-47`. |
| FR-ADM-004 | Partial | Admin restrict action exists at `server/apps/admin/views.py:49-54`, and login blocks restricted users. Checkout does not re-check account status for existing valid tokens. |
| FR-ADM-005 | Partial | Admin soft-delete sets status/deleted_at at `server/apps/admin/views.py:56-61`; existing-token active-flow blocking is incomplete. |
| FR-ADM-006 | Partial | Backend admin product creation exists through `AdminProductViewSet`, but the Angular admin products page has no create product form. It only lists, edits stock, uploads images, toggles active state, and deletes. |
| FR-ADM-007 | Partial | Backend serializer supports product fields/category/images/stock, but Angular admin UI exposes only stock, active toggle, image upload, and delete at `client/src/app/features/admin/pages/admin-products/admin-products.ts:74-216`. |
| FR-ADM-008 | Partial | Custom `POST /deactivate/` deactivates products at `server/apps/products/views.py:116-121`, but SRS/API says `DELETE` deactivates. Current default `DELETE` from `ModelViewSet` hard-deletes unless constrained by related data. |
| FR-ADM-009 | Partial | Backend category CRUD and custom deactivate exist. Same `DELETE` versus deactivate mismatch applies to categories. |
| FR-ADM-010 | Partial | Admin orders/payments lists exist, but SRS says admin order list can filter by status. `AdminOrderViewSet.get_queryset()` returns all orders without status filtering at `server/apps/admin/views.py:64-71`. |
| FR-ADM-011 | Verified | Admin review list, hide, and delete are implemented at `server/apps/admin/views.py:83-101`. |
| FR-ADM-012 | Partial | Admin APIs use `IsAdminUser` and Angular admin routes use guards. Backend permission is staff-based, not strictly role-based. |

### Reviews

| ID | Status | Fact check |
|---|---|---|
| FR-REV-001 | Verified | Product-scoped authenticated POST creates reviews through `ProductReviewListCreateView` at `server/apps/reviews/views.py:95-110`. |
| FR-REV-002 | Verified | Conditional unique constraint and service pre-check enforce one active review per user/product at `server/apps/reviews/models.py:42-52` and `server/apps/reviews/services.py:59-80`. |
| FR-REV-003 | Verified | Rating uses min/max validators and serializer bounds at `server/apps/reviews/models.py:33-35`. |
| FR-REV-004 | Verified | Comment is blank-allowed at `server/apps/reviews/models.py:36` and optional in serializers. |
| FR-REV-005 | Verified | Owner review update is implemented through `ReviewViewSet.partial_update()` at `server/apps/reviews/views.py:155-163`. |
| FR-REV-006 | Verified with test mismatch | Owner delete soft-deletes through `delete_review()` at `server/apps/reviews/services.py:119-133`. Backend API test currently expects hard delete and fails. |
| FR-REV-007 | Partial | Backend returns visible/non-deleted reviews using `selectors.get_visible_product_reviews()` at `server/apps/reviews/selectors.py:27-45`; Angular `ReviewService.getProductReviews()` expects `Review[]`, not the backend paginated response shape. |
| FR-REV-008 | Partial | Review aggregate helper correctly excludes deleted reviews, but product catalog annotations do not exclude `deleted_at`, so product detail can count soft-deleted visible reviews. Compare `server/apps/reviews/selectors.py:48-71` with `server/apps/products/selectors.py:24-30`. |
| FR-REV-009 | Verified | `IsReviewOwner` is used by the review viewset and rejects non-owner modification. |

## Non-Functional Requirements Matrix

| ID | Status | Fact check |
|---|---|---|
| NFR-PER-001 | Partial | Products, admin lists, and review lists have bounded pagination. Some list endpoints are intentionally or accidentally unpaginated, such as categories and authenticated order list. |
| NFR-PER-002 | Partial | Many common fields are indexed (`email`, `phone`, product category/price/is_active, review visibility/product, order status/user). The SRS specifically mentions PostgreSQL-backed indexes, but the project default database is MySQL/MariaDB. |
| NFR-PER-003 | Verified | Product list and detail serializers differ; list payload excludes detail-only fields. |
| NFR-PER-004 | Verified | Product image serializers return URLs, not embedded image data. |
| NFR-PER-005 | Not verifiable | No benchmark or performance test demonstrating 500 ms list responses was found or run. |
| NFR-SEC-001 | Partial | `production.py` enables HTTPS redirect and secure cookies, but this cannot prove deployed production traffic uses HTTPS. |
| NFR-SEC-002 | Verified | `CustomUser.create_user()` uses `set_password()` via Django's password hashing. |
| NFR-SEC-003 | Verified | JWT access token is 30 minutes and refresh token is 7 days at `server/config/settings/base.py:173-178`. |
| NFR-SEC-004 | Partial | Most API inputs use serializers/services. Some paths still rely on database/model errors or view logic, such as admin product create without required `category_id`. |
| NFR-SEC-005 | Verified | CORS origins are environment-controlled at `server/config/settings/base.py:144-149` and production overrides default to an empty env-derived list. |
| NFR-SEC-006 | Partial | Global throttles and an `auth` throttle scope exist, but payment/review endpoints do not have dedicated scoped rates. |
| NFR-SEC-007 | Partial | Secrets are loaded from env with local fallbacks. I did not audit Git history, so "never committed" is not verifiable from this checkout alone. |
| NFR-SEC-008 | Partial | Image upload size is validated in serializer and extension is validated on the model, but MIME/content sniffing is not implemented. |
| NFR-MNT-001 | Verified | Domain Django apps are under `server/apps/`, including the admin app. |
| NFR-MNT-002 | Verified | Split settings exist: `base.py`, `development.py`, `production.py`, and `testing.py`. |
| NFR-MNT-003 | Partial | Services exist for major workflows, but admin views mutate models directly and product default create/update operations can bypass service functions. |
| NFR-MNT-004 | Partial | Selectors exist for users/products/reviews. Some views still build queries directly, especially admin, cart, orders, and parts of products. |
| NFR-MNT-005 | Partial | Many views are thin, but admin actions and product stock update contain business mutation/validation logic directly. |
| NFR-MNT-006 | Verified | Angular feature code lives under `client/src/app/features/`. |
| NFR-MNT-007 | Verified | Guards, interceptors, core API/auth services, and shared user model live under `client/src/app/core/`. |
| NFR-MNT-008 | Partial | Reusable components live under `shared/components`; no shared pipes/directives are present, which may be acceptable if not needed. |
| NFR-MNT-009 | Partial | Python dependencies are managed by `uv`, but the current `.venv/bin/pytest` wrapper is stale. `uv run pytest` fails until the environment/wrapper is repaired. |
| NFR-MNT-010 | Verified | Migration files are present for current model changes. |
| NFR-TST-001 | Partial | Backend service/API tests exist, but the backend test suite currently has two failures. |
| NFR-TST-002 | Partial | Integration tests exist for auth/cart/checkout/admin/reviews, but two review API tests fail. |
| NFR-TST-003 | Partial | Angular tests exist for several services/interceptors/components. I did not find equivalent service tests for every feature, such as cart, checkout, and reviews. |
| NFR-TST-004 | Not implemented | No `.github/workflows/` CI workflow files are present. |

## Architecture and Data Model Accuracy

### Accurate or mostly accurate

- Django app placement mostly matches the SRS, with the addition of `apps/admin/`.
- Angular feature/core/shared/layout structure exists and is used.
- Settings are split by environment.
- JWT, DRF, CORS, filtering, media, and split settings are configured.

### Inaccurate or outdated

| SRS claim | Current project fact |
|---|---|
| PostgreSQL is the database and primary assumption. | Default database engine is MySQL/MariaDB in `server/config/settings/base.py:84-92`; PostgreSQL is only possible through `DB_ENGINE` and `psycopg`. |
| Most domain model IDs are UUIDs. | `CustomUser` and `EmailConfirmationToken` use UUIDs, but products, categories, cart, orders, payments, wallets, and reviews use Django `BigAutoField` integer IDs via `DEFAULT_AUTO_FIELD`. |
| `Product.stock_quantity` exists. | Code uses `Product.stock` at `server/apps/products/models.py:41`. |
| Category name is unique. | `Category.name` is indexed but not unique at `server/apps/products/models.py:7`. |
| `ProductImage.sort_order` exists. | No `sort_order` field exists in `ProductImage`; ordering is by `is_primary` and `created_at`. |
| A user can own multiple carts with one active cart, and carts have status. | `Cart.user` is `OneToOneField`, and `Cart` has no `status` at `server/apps/cart/models.py:9-12`. |
| Order has `customer_email` and `customer_phone` fields. | Model fields are named `email` and `phone` at `server/apps/orders/models.py:30-31`; serializer/admin aliases handle some output. |
| `OrderItem.product` is nullable. | Code uses non-null `ForeignKey(..., on_delete=models.PROTECT)` at `server/apps/orders/models.py:64-66`. |
| An order can contain many payment attempts. | `Payment.order` is one-to-one at `server/apps/payments/models.py:19`. |
| Payment has `provider`, `cancelled`, and `confirmed_at`. | Current `Payment` lacks those fields/statuses at `server/apps/payments/models.py:7-28`. |
| Wallet transactions use `WalletTransaction` with `order`, `transaction_type`, `refund`, and `reference_id`. | Current model is `WalletLedgerEntry`, linked to `Payment`, with `credit/debit`, `balance_after`, and `note` at `server/apps/payments/models.py:47-61`. |

## API Contract Accuracy

| SRS API claim | Status | Detail |
|---|---|---|
| `GET /api/v1/products/` lists products. | Inaccurate | Actual route is `/api/v1/products/products/`. The SRS itself is inconsistent because product detail is listed as `/api/v1/products/products/{slug}/`. |
| `DELETE /api/v1/products/admin/products/{slug}/` deactivates a product. | Inaccurate | `AdminProductViewSet` does not override `destroy`; default DRF behavior is hard delete. Deactivation is a custom `POST /deactivate/` action. |
| `DELETE /api/v1/products/admin/categories/{slug}/` deactivates a category. | Inaccurate | Same issue as products. Deactivation is custom `POST /deactivate/`; default `DELETE` hard-deletes. |
| `GET /api/v1/admin/orders/` filters by status. | Partial | Endpoint exists, but no status filter is implemented in `AdminOrderViewSet.get_queryset()`. |
| `GET /api/v1/products/{product_slug}/reviews/` returns visible product reviews. | Partial | Backend returns paginated visible/non-deleted reviews. Angular service and backend test expect a bare array. |
| `GET /api/v1/orders/{order_number}/` supports guest order context. | Partial | Guest order detail is retrievable by order number alone. This matches the current tests but is weaker than a true guest context token/session. |

## Frontend Accuracy

| SRS Angular map claim | Status | Detail |
|---|---|---|
| Auth registration, confirmation, login, logout, and session flows exist. | Verified | Implemented under `client/src/app/features/auth/` and `core/services/auth.service.ts`. |
| Product listing, filters, detail, and stock state UI exist. | Verified | Implemented under `client/src/app/features/products/`. |
| Authenticated and guest cart UI exists. | Verified | Guest cart uses localStorage; authenticated cart uses backend endpoints. |
| Checkout forms, guest checkout, payment selection, and order placement exist. | Partial | Form exists and places orders, but pre-placement summary lacks item list, charges, and final total. |
| Order confirmation/detail views exist. | Partial | `orders/:orderNumber` exists. There is no `/orders` list route even though the header links to `/orders`. |
| Profile shows role, email confirmation state, and account status only. | Partial | Profile shows role/status and editable name/phone, but not email confirmation state. |
| Admin user, catalog, order, payment, and review moderation screens exist. | Partial | Screens exist. Product admin UI lacks full product create/edit forms; it focuses on stock, active flag, image upload, and delete. |
| Review form, review list, and rating widgets embedded in product flows. | Partial | A separate `reviews/:slug` page exists. Product detail does not embed the review form/list, and the review list service type does not match backend pagination. |

## Secondary Documentation Mismatches

- `docs/requirements.md` is stale. It still marks many cart, checkout, payments, admin, and review requirements unchecked even though most corresponding backend/frontend code exists.
- `README.md` "Current baseline" says implemented backend/frontend slices are users/auth and product catalog, but the repository now includes cart, checkout/orders, payments, admin, and reviews.
- `README.md` references `docs/GITHUB_SETUP.md`, but that file is currently deleted in the working tree.

## Recommended Fixes

1. Decide whether the SRS should describe the implemented project or the target final release. If it is meant to describe current implementation, downgrade claims around PostgreSQL, Stripe/PayPal, UUID IDs, cart conversion, full payment attempts, and frontend admin product CRUD.
2. Repair backend test execution by regenerating the virtual environment or fixing the stale `.venv/bin/pytest` wrapper, then fix the two review API tests.
3. Align review list response expectations across backend tests and Angular:
   - Either keep paginated backend responses and update tests/frontend to read `results`.
   - Or remove pagination from product reviews if the project wants bare arrays.
4. Fix product/category `DELETE` semantics:
   - Override `destroy()` to deactivate, matching the SRS.
   - Or update SRS/API docs and frontend labels so `DELETE` is honestly documented as hard delete.
5. Add account-status checks to checkout so restricted or soft-deleted users with still-valid tokens cannot place new orders.
6. Either add `Cart.status` and mark carts converted, or update the SRS to say authenticated checkout clears cart items.
7. Add real Stripe/PayPal integration or rename the SRS payment requirement to "sandbox card payment" for the current release.
8. Add `Payment.provider`, `confirmed_at`, `cancelled` handling, and multiple attempt support if payment retry/recovery is required.
9. Update product review aggregate annotations to exclude `deleted_at__isnull=False`.
10. Add missing frontend admin product create/edit screens if the Angular admin UI is part of the SRS acceptance surface.
11. Add `.github/workflows/` CI for backend checks/tests, frontend lint/test/build.

## Overall Conclusion

The SRS is a good high-level target document, but it is not a fully accurate statement of the current project. The implementation covers most core e-commerce workflows, but several SRS claims are aspirational, stale, or contradicted by code. The most urgent corrections are payment-provider accuracy, database assumptions, data model shape, cart conversion behavior, delete/deactivate semantics, review API/test/frontend alignment, and CI.
