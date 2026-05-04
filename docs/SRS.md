# SRS.md

## 1. Introduction

### 1.1 Purpose

This document defines the Software Requirements Specification for Stack, a full-stack e-commerce platform built with Django, Django REST Framework, PostgreSQL, and Angular using standalone components.

### 1.2 Scope

The core release covers customer registration and authentication, product browsing, authenticated cart management, guest checkout, order creation, card, Cash on Delivery, and wallet payments, product reviews, and admin operations for users, catalog data, orders, payments, and review moderation.

### 1.3 Intended Audience

- Backend developers working in Django and DRF
- Frontend developers working in Angular
- QA engineers validating functional and non-functional scope
- Technical leads reviewing milestones, dependencies, and delivery scope

### 1.4 Definitions

- JWT: JSON Web Token used for API authentication
- COD: Cash on Delivery
- DRF: Django REST Framework
- Provider: The configured online card processor, either Stripe or PayPal

## 2. System Overview

- Backend: Django + DRF, managed with `uv`
- Frontend: Angular latest standalone-component workflow
- Database: PostgreSQL
- Authentication: JWT access and refresh tokens
- Payments: One configured card provider, either Stripe or PayPal, plus COD and wallet
- Repository strategy: GitHub feature branches merged through `develop`
- Guest cart strategy: guest cart state is maintained in the Angular application and submitted during guest checkout; authenticated carts are persisted server-side

## 3. Stakeholders

- Customers browsing products, managing carts, checking out, and leaving reviews
- Admins moderating users, catalog data, orders, payments, and reviews
- Developers implementing parallel backend and frontend slices
- QA reviewers validating release readiness

## 4. Functional Requirements

### 4.1 User Management

| ID | Description | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-USR-001 | Register a customer using a unique email address, a unique phone number, and a password. | High | Valid unique email, phone, and password values create a new customer account. |
| FR-USR-002 | Reject duplicate email registration. | High | Registration returns a validation error when the email is already assigned to another account. |
| FR-USR-003 | Reject duplicate phone registration. | High | Registration returns a validation error when the phone number is already assigned to another account. |
| FR-USR-004 | Send a confirmation email after registration. | High | Successful registration creates a confirmation token or link and dispatches it to the submitted email address. |
| FR-USR-005 | Confirm an email address using a token or link. | High | Submitting a valid unused confirmation token or link marks the user's email as confirmed. |
| FR-USR-006 | Prevent unconfirmed users from logging in. | High | Token creation fails for accounts whose email is not confirmed. |
| FR-USR-007 | Authenticate with email and password. | High | Valid confirmed credentials submitted with email return a JWT access and refresh token pair. |
| FR-USR-008 | Authenticate with phone number and password. | High | Valid confirmed credentials submitted with phone number return a JWT access and refresh token pair. |
| FR-USR-009 | Issue JWT access and refresh tokens after login. | High | Successful login responses include both token types. |
| FR-USR-010 | Refresh access tokens. | High | A valid refresh token returns a new access token. |
| FR-USR-011 | Log out by invalidating or blacklisting refresh tokens. | High | A logged-out refresh token can no longer be reused. |
| FR-USR-012 | Support exactly two application roles: Customer and Admin. | High | Admin-only APIs and routes reject authenticated users without the Admin role. |
| FR-USR-013 | Expose the current authenticated user's identity, role, email confirmation state, and account status. | High | The current-user endpoint returns the fields required for route protection and UI state. |
| FR-USR-014 | Block pending-approval and restricted users from login and new orders. | High | Pending-approval and restricted accounts cannot obtain new JWT tokens or place checkout requests. |
| FR-USR-015 | Block soft-deleted users from login. | High | Soft-deleted accounts cannot obtain new JWT tokens. |

### 4.2 Product Catalog

| ID | Description | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-PRD-001 | Provide a paginated list of active products. | High | Product listing returns active products and bounded pagination metadata. |
| FR-PRD-002 | Return list item summary fields. | High | Each product list item includes name, primary image URL, price, category, and stock availability state. |
| FR-PRD-003 | Provide product detail data. | High | Product detail includes name, description, images, price, category, stock availability, average rating, and review count. |
| FR-PRD-004 | Search products by product name. | High | Search queries return matching products. |
| FR-PRD-005 | Filter products by category. | High | Category filters return only products assigned to the selected category. |
| FR-PRD-006 | Filter products by minimum and maximum price. | High | Price-bound queries return only products inside the supplied range. |
| FR-PRD-007 | Combine search and filters. | High | Search, category, and price filters can be used together in one request. |
| FR-PRD-008 | Display out-of-stock products as unavailable for purchase. | High | Products with `stock_quantity=0` remain visible but cannot be added to cart or ordered. |
| FR-PRD-009 | Store and serve product images through media storage. | High | Uploaded product images are stored by the configured media backend and returned by URL. |
| FR-PRD-010 | Require each product to belong to exactly one category. | High | Product create and update validation reject missing category values. |

### 4.3 Cart

| ID | Description | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-CRT-001 | Allow authenticated customers to add in-stock products to cart. | High | Adding a valid product creates or updates a cart line tied to the authenticated customer. |
| FR-CRT-002 | Allow guests to maintain a frontend-managed cart for checkout without creating an account. | Medium | The frontend can preserve guest cart items locally and submit them during guest checkout. |
| FR-CRT-003 | Allow cart item quantity changes. | High | Quantity updates recalculate item subtotal and cart total. |
| FR-CRT-004 | Allow cart item removal. | High | Removing an item deletes it from the active cart and returns updated totals. |
| FR-CRT-005 | Reject cart quantities greater than stock. | High | Add and update operations fail when requested quantity exceeds available stock. |
| FR-CRT-006 | Return a server-calculated cart summary for authenticated carts. | High | Authenticated cart responses include line totals, subtotal, configured charges, and final total. |

### 4.4 Checkout and Orders

| ID | Description | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-CHK-001 | Show an order summary before placement. | High | Checkout summary includes items, subtotal, applicable charges, and final total before order placement. |
| FR-CHK-002 | Allow registered customers to place orders. | High | A valid authenticated checkout creates an order linked to the user account. |
| FR-CHK-003 | Allow guests to place orders. | High | A valid guest checkout creates an order without requiring account creation. |
| FR-CHK-004 | Require guest checkout contact, shipping, and payment-selection details. | High | Guest checkout requests fail unless email, phone, shipping address, and required payment-selection inputs are present. |
| FR-ORD-001 | Create orders with unique order numbers. | High | Successful checkout creates an order with a unique public order number. |
| FR-ORD-002 | Snapshot order item data. | High | Order items store product name, unit price, quantity, and line total at checkout time. |
| FR-ORD-003 | Revalidate stock at checkout. | High | Checkout fails if any selected product is unavailable or insufficiently stocked. |
| FR-ORD-004 | Decrement stock atomically. | High | Successful order creation updates stock in a transaction to prevent overselling. |
| FR-ORD-005 | Convert the active authenticated cart after order creation. | Medium | After successful authenticated checkout, the cart is marked converted and is no longer used as the active cart. |
| FR-ORD-006 | Return order confirmation data. | High | Successful checkout responses include order number, items, totals, order status, and payment status. |

### 4.5 Payments

| ID | Description | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-PAY-001 | Support card payment through one configured provider: Stripe or PayPal. | High | Card payment creates a provider-backed payment attempt and returns the metadata needed to continue the client flow. |
| FR-PAY-002 | Support Cash on Delivery. | High | COD orders are created without online payment authorization and retain a pending collection or COD payment state. |
| FR-PAY-003 | Support Wallet payment. | High | Wallet payment succeeds only when the current wallet balance covers the order total. |
| FR-PAY-004 | Reject insufficient wallet balance. | High | Insufficient wallet balance fails the payment without marking the order paid. |
| FR-PAY-005 | Create payment records for payment attempts. | High | Every payment attempt persists a Payment record. |
| FR-PAY-006 | Store payment metadata. | High | Payment records store method, amount, status, provider, provider reference, and related order. |
| FR-PAY-007 | Verify provider webhook signatures. | High | Unsigned or invalidly signed provider notifications are rejected without state changes. |
| FR-PAY-008 | Confirm paid online orders only after verified provider success, and keep failed or canceled payments recoverable. | High | Online orders move to paid only after verified provider success, and failed or canceled online payments remain unpaid or failed for retry or support workflows. |
| FR-PAY-009 | Avoid raw card data storage. | High | The application stores provider references only and never persists raw card numbers, CVV values, or full card payloads. |
| FR-PAY-010 | Calculate payment amounts server-side. | High | Payment amount values come from backend-calculated order totals, not client input. |

### 4.6 Admin

| ID | Description | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-ADM-001 | View registered users. | High | Admin user list returns paginated registered users. |
| FR-ADM-002 | Search users by email or phone. | High | Admin user search returns matching accounts. |
| FR-ADM-003 | Approve pending users. | High | Admin approval updates account status from `pending_approval` to `active`. |
| FR-ADM-004 | Restrict users. | High | Restricted users are blocked from login and new orders. |
| FR-ADM-005 | Soft-delete users. | High | Soft-deleted users are excluded from active flows without deleting historical orders or reviews. |
| FR-ADM-006 | Create products. | High | Admin product creation persists valid product data. |
| FR-ADM-007 | Update product fields, images, category, and stock. | High | Admin product updates persist valid changes and affect storefront availability. |
| FR-ADM-008 | Deactivate products. | High | Deactivated products are excluded from customer product listings. |
| FR-ADM-009 | Manage categories. | High | Admins can create, update, and deactivate categories. |
| FR-ADM-010 | View order and payment status. | Medium | Admin order and payment views expose current operational status. |
| FR-ADM-011 | Moderate reviews. | Medium | Admins can hide or remove reviews from public display. |
| FR-ADM-012 | Block non-admin access. | High | Non-admin requests to admin endpoints and admin routes return authorization errors. |

### 4.7 Reviews

| ID | Description | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-REV-001 | Create product reviews. | High | Authenticated customers can submit a review for a product. |
| FR-REV-002 | Enforce one active review per customer per product. | High | Duplicate active review creation is rejected. |
| FR-REV-003 | Validate rating range. | High | Ratings outside integer values 1 through 5 are rejected. |
| FR-REV-004 | Allow optional written feedback. | Medium | A review can be saved with or without comment text. |
| FR-REV-005 | Edit own reviews. | Medium | Customers can update only reviews they authored. |
| FR-REV-006 | Delete own reviews. | Medium | Customers can delete only reviews they authored. |
| FR-REV-007 | List approved or visible product reviews. | High | Product review responses return only visible public reviews for the selected product. |
| FR-REV-008 | Calculate average rating and review count. | High | Product detail reflects visible reviews in aggregate metrics. |
| FR-REV-009 | Prevent editing or deleting other users' reviews. | High | Non-owner update and delete attempts return authorization errors. |

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-PER-001 | List endpoints that can return many records use bounded pagination with a default page size. | List responses return bounded result sets and pagination metadata. |
| NFR-PER-002 | Product search, category filter, price filter, and ownership lookup fields use PostgreSQL-backed indexes where appropriate. | Frequently filtered fields are indexed or otherwise query-optimized. |
| NFR-PER-003 | API list responses avoid returning unnecessary detail-only fields. | List payloads remain smaller than detail payloads and exclude fields not needed for list rendering. |
| NFR-PER-004 | Product images are served by URL through configured media storage. | API payloads reference media URLs instead of embedding image data. |
| NFR-PER-005 | List endpoints respond within 500 ms under normal development or demo load. | Local or demo benchmark checks show bounded list endpoints meeting the target under expected conditions. |

### 5.2 Security

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-SEC-001 | Production traffic uses HTTPS. | Production deployment terminates HTTPS before serving authenticated or payment traffic. |
| NFR-SEC-002 | Passwords use Django password hashers. | Password values are stored as hashes only and are never returned through APIs. |
| NFR-SEC-003 | JWT access tokens are short-lived relative to refresh tokens. | Access tokens expire sooner than refresh tokens and are renewed only through the refresh endpoint. |
| NFR-SEC-004 | API input is validated server-side before database writes. | Invalid input is rejected before persistence and surfaced through predictable validation errors. |
| NFR-SEC-005 | CORS allow-lists are environment-controlled. | Only approved frontend origins can call the production API cross-origin. |
| NFR-SEC-006 | Authentication, payment-sensitive, and review-submission endpoints are rate-limited. | Repeated abusive requests are throttled without disabling normal user flows. |
| NFR-SEC-007 | Secrets are stored in environment variables and never committed to source control. | Repository history and tracked files do not contain runtime secrets. |
| NFR-SEC-008 | Uploaded product images are validated for allowed type and size. | Invalid file types and oversized uploads are rejected before persistence. |

### 5.3 Scalability and Maintainability

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-MNT-001 | Django apps remain under `apps/`. | New domain code is added to app packages rather than `config/`. |
| NFR-MNT-002 | Django settings are split by environment. | `config/settings/{base,development,production,testing}.py` exists and is used consistently. |
| NFR-MNT-003 | Backend business workflows live in `services.py`. | Cross-step business logic is not implemented directly inside views. |
| NFR-MNT-004 | Query logic lives in `selectors.py`. | Read-oriented query composition is isolated from views and serializers. |
| NFR-MNT-005 | Views orchestrate HTTP request and response handling only. | Views stay thin and delegate business logic and query logic appropriately. |
| NFR-MNT-006 | Angular feature code lives under `src/app/features/`. | Feature-owned screens, services, and state remain inside their feature directories. |
| NFR-MNT-007 | Angular guards, interceptors, API services, and shared models live under `src/app/core/`. | Application-wide infrastructure stays in `core/`. |
| NFR-MNT-008 | Angular reusable UI components, pipes, and directives live under `src/app/shared/`. | Shared presentational assets remain decoupled from feature-specific business logic. |
| NFR-MNT-009 | Python dependencies are managed with `uv`. | Project dependency changes are made through `uv add`, `uv remove`, and `uv sync`. |
| NFR-MNT-010 | Database migrations are committed with related model changes. | Pull requests that change models include the matching migration files. |

### 5.4 Testing

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-TST-001 | Backend services and selectors have automated tests. | Backend test suites cover expected success cases and high-risk error cases for service and selector logic. |
| NFR-TST-002 | API endpoints have integration tests covering successful and error paths. | Integration tests exercise auth, validation, permission, and state-transition cases. |
| NFR-TST-003 | Angular feature services have automated tests. | Frontend service logic is verified through automated tests for key flows. |
| NFR-TST-004 | Continuous integration runs backend tests, frontend tests, linting, and build checks on pull requests. | Pull requests execute the required verification steps before merge. |

## 6. System Architecture

### 6.1 Backend Structure

```text
config/
├── settings/{base,development,production,testing}.py
├── urls.py
├── asgi.py
└── wsgi.py

apps/
├── users/
├── products/
├── cart/
├── orders/
├── payments/
└── reviews/
```

### 6.2 Frontend Structure

```text
src/app/
├── core/
│   ├── guards/
│   ├── interceptors/
│   ├── models/
│   └── services/
├── shared/
│   ├── components/
│   ├── directives/
│   └── pipes/
├── layout/
├── features/
│   ├── auth/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── profile/
│   ├── admin/
│   └── reviews/
└── app.routes.ts
```

## 7. Data Models

### 7.1 Relationship Summary

- A `User` can own multiple `Cart` records but only one active authenticated cart at a time.
- A `User` can place many `Order` records.
- A `Category` can contain many `Product` records.
- A `Product` can have many `ProductImage` and `Review` records.
- A `Cart` can contain many `CartItem` records.
- An `Order` can contain many `OrderItem` and `Payment` records.
- A `User` can have one `Wallet`.
- A `Wallet` can have many `WalletTransaction` records.

### 7.2 User

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary key | User identifier |
| email | Email | Unique, required, indexed | Login and contact email |
| phone | String | Unique, required, indexed | Login and contact phone number |
| password | String | Required, hashed | Stored Django password hash |
| role | Enum | `customer`, `admin`; required | Authorization role |
| status | Enum | `pending_approval`, `active`, `restricted`, `soft_deleted`; required | Account lifecycle state |
| is_email_confirmed | Boolean | Default `false` | Email verification state |
| deleted_at | DateTime | Nullable | Soft-delete timestamp |
| created_at | DateTime | Auto-created | Creation timestamp |
| updated_at | DateTime | Auto-updated | Last update timestamp |

### 7.3 Category

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary key | Category identifier |
| name | String | Unique, required | Category display name |
| slug | Slug | Unique, required | URL-safe category value |
| description | Text | Nullable | Optional category description |
| is_active | Boolean | Default `true` | Category visibility state |
| created_at | DateTime | Auto-created | Creation timestamp |
| updated_at | DateTime | Auto-updated | Last update timestamp |

### 7.4 Product

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary key | Product identifier |
| category | ForeignKey | Required -> `Category` | Assigned category |
| name | String | Required, indexed | Product name |
| slug | Slug | Unique, required | URL-safe product value |
| description | Text | Required | Product description |
| price | Decimal(10,2) | Required, non-negative | Current product price |
| stock_quantity | Integer | Required, non-negative | Available stock |
| is_active | Boolean | Default `true` | Storefront visibility state |
| created_at | DateTime | Auto-created | Creation timestamp |
| updated_at | DateTime | Auto-updated | Last update timestamp |

### 7.5 ProductImage

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary key | Image identifier |
| product | ForeignKey | Required -> `Product` | Owning product |
| image | Image/File | Required | Stored product image |
| alt_text | String | Nullable | Accessibility text |
| is_primary | Boolean | Default `false` | Primary display image marker |
| sort_order | Integer | Default `0` | Display order |
| created_at | DateTime | Auto-created | Creation timestamp |

### 7.6 Cart

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary key | Cart identifier |
| user | ForeignKey | Required -> `User` | Authenticated cart owner |
| status | Enum | `active`, `converted`, `abandoned`; required | Cart lifecycle state |
| created_at | DateTime | Auto-created | Creation timestamp |
| updated_at | DateTime | Auto-updated | Last update timestamp |

### 7.7 CartItem

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary key | Cart item identifier |
| cart | ForeignKey | Required -> `Cart` | Parent cart |
| product | ForeignKey | Required -> `Product` | Referenced product |
| quantity | Integer | Required, greater than zero | Requested quantity |
| unit_price_snapshot | Decimal(10,2) | Required, non-negative | Price used for cart-total calculation |
| created_at | DateTime | Auto-created | Creation timestamp |
| updated_at | DateTime | Auto-updated | Last update timestamp |
| unique_per_cart_product | Constraint | Unique on (`cart`, `product`) | One active cart line per product |

### 7.8 Order

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary key | Order identifier |
| user | ForeignKey | Nullable -> `User` | Authenticated customer owner, null for guest orders |
| order_number | String | Unique, required | Public order reference |
| customer_email | Email | Required | Checkout contact email |
| customer_phone | String | Required | Checkout contact phone |
| shipping_address | JSON/Text | Required | Shipping address snapshot |
| status | Enum | `pending`, `confirmed`, `cancelled`, `failed`; required | Order lifecycle state |
| payment_status | Enum | `pending`, `paid`, `failed`, `cod_pending`; required | Payment state summary on the order |
| subtotal | Decimal(10,2) | Required, non-negative | Sum of order line totals before fees |
| shipping_amount | Decimal(10,2) | Required, non-negative | Shipping amount if applicable |
| tax_amount | Decimal(10,2) | Required, non-negative | Tax amount if applicable |
| discount_amount | Decimal(10,2) | Required, non-negative | Discount amount if applicable |
| total_amount | Decimal(10,2) | Required, non-negative | Final payable amount |
| created_at | DateTime | Auto-created | Creation timestamp |
| updated_at | DateTime | Auto-updated | Last update timestamp |

### 7.9 OrderItem

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary key | Order item identifier |
| order | ForeignKey | Required -> `Order` | Parent order |
| product | ForeignKey | Nullable -> `Product` | Original product reference retained when available |
| product_name | String | Required | Product name at checkout time |
| unit_price | Decimal(10,2) | Required, non-negative | Captured purchase price |
| quantity | Integer | Required, greater than zero | Purchased quantity |
| line_total | Decimal(10,2) | Required, non-negative | `unit_price * quantity` snapshot |

### 7.10 Payment

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary key | Payment identifier |
| order | ForeignKey | Required -> `Order` | Related order |
| method | Enum | `card`, `cod`, `wallet`; required | Selected payment method |
| provider | Enum/String | Nullable; `stripe`, `paypal`, `internal` | External or internal payment provider |
| status | Enum | `pending`, `paid`, `failed`, `cancelled`, `cod_pending`; required | Payment lifecycle state |
| amount | Decimal(10,2) | Required, non-negative | Attempted payment amount |
| provider_reference | String | Nullable | External gateway or internal reference |
| created_at | DateTime | Auto-created | Creation timestamp |
| updated_at | DateTime | Auto-updated | Last update timestamp |
| confirmed_at | DateTime | Nullable | Confirmation timestamp when the attempt is finalized |

### 7.11 Wallet

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary key | Wallet identifier |
| user | OneToOne | Required -> `User` | Wallet owner |
| balance | Decimal(10,2) | Required, non-negative, default `0.00` | Current available balance |
| updated_at | DateTime | Auto-updated | Last balance update timestamp |

### 7.12 WalletTransaction

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary key | Wallet transaction identifier |
| wallet | ForeignKey | Required -> `Wallet` | Related wallet |
| order | ForeignKey | Nullable -> `Order` | Related order when the transaction is order-backed |
| amount | Decimal(10,2) | Required | Debit or credit amount |
| transaction_type | Enum | `debit`, `credit`, `refund`; required | Wallet transaction category |
| reference_id | String | Nullable | External provider or internal reference |
| created_at | DateTime | Auto-created | Creation timestamp |

### 7.13 Review

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | Primary key | Review identifier |
| product | ForeignKey | Required -> `Product` | Reviewed product |
| user | ForeignKey | Required -> `User` | Review author |
| rating | Integer | Required, 1 through 5 | Numeric rating |
| comment | Text | Nullable | Optional written review |
| is_visible | Boolean | Default `true` | Public visibility flag used by moderation |
| deleted_at | DateTime | Nullable | Soft-delete timestamp for customer deletion or moderation workflows |
| created_at | DateTime | Auto-created | Creation timestamp |
| updated_at | DateTime | Auto-updated | Last update timestamp |
| unique_active_review | Constraint | Unique active review per (`product`, `user`) | Prevents more than one active review per customer per product |

## 8. API Contract Overview

Base path: `/api/v1`

### 8.1 Auth and Users

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register/` | Public | Register a new customer account with email, phone, and password. |
| POST | `/api/v1/auth/confirm-email/` | Public | Confirm a user's email address using a confirmation token. |
| POST | `/api/v1/auth/login/` | Public | Log in with email or phone plus password and return JWT tokens. |
| POST | `/api/v1/auth/token/refresh/` | Public | Exchange a valid refresh token for a new access token. |
| POST | `/api/v1/auth/logout/` | Authenticated | Invalidate or blacklist the submitted refresh token. |
| GET | `/api/v1/users/me/` | Authenticated | Retrieve the current user's identity, role, email confirmation state, and account status. |

### 8.2 Products and Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/products/` | Public | List active products with search, category filter, price filter, and pagination. |
| GET | `/api/v1/products/products/{slug}/` | Public | Retrieve product details including images and review summary. |
| GET | `/api/v1/products/categories/` | Public | List active product categories. |
| POST | `/api/v1/products/admin/products/` | Admin | Create a product. |
| PATCH | `/api/v1/products/admin/products/{slug}/` | Admin | Update product fields, stock, category, or image metadata. |
| DELETE | `/api/v1/products/admin/products/{slug}/` | Admin | Deactivate a product. |
| POST | `/api/v1/products/admin/product-images/` | Admin | Upload a product image. |
| POST | `/api/v1/products/admin/categories/` | Admin | Create a category. |
| PATCH | `/api/v1/products/admin/categories/{slug}/` | Admin | Update a category. |
| DELETE | `/api/v1/products/admin/categories/{slug}/` | Admin | Deactivate a category. |

### 8.3 Cart

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/cart/` | Authenticated | Retrieve the authenticated customer's active cart. |
| POST | `/api/v1/cart/items/` | Authenticated | Add a product to the active authenticated cart. |
| PATCH | `/api/v1/cart/items/{id}/` | Authenticated | Update cart item quantity. |
| DELETE | `/api/v1/cart/items/{id}/` | Authenticated | Remove a cart item. |

### 8.4 Orders and Checkout

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/orders/checkout/` | Public or Authenticated | Create a guest or authenticated order from submitted checkout data and item payloads. |
| GET | `/api/v1/orders/{order_number}/` | Authenticated owner, guest order context, or Admin | Retrieve order detail and confirmation data. |
| GET | `/api/v1/admin/orders/` | Admin | List orders and filter by status. |

### 8.5 Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/orders/checkout/` | Public or Authenticated | Create an order and its initial payment attempt in one server-calculated checkout flow. |
| POST | `/api/v1/payments/webhooks/sandbox/` | Public, provider-signed | Receive verified sandbox card-provider webhook events. |
| GET | `/api/v1/admin/payments/` | Admin | List payment records for support and verification. |

### 8.6 Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/products/{product_slug}/reviews/` | Public | List visible reviews for a product. |
| POST | `/api/v1/products/{product_slug}/reviews/` | Authenticated Customer | Create a review for a product. |
| PATCH | `/api/v1/reviews/{id}/` | Authenticated Owner | Update the current user's own review. |
| DELETE | `/api/v1/reviews/{id}/` | Authenticated Owner | Delete the current user's own review. |
| PATCH | `/api/v1/admin/reviews/{id}/hide/` | Admin | Change review visibility for moderation. |

### 8.7 Admin Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/admin/users/` | Admin | List user accounts and support search by email or phone. |
| PATCH | `/api/v1/admin/users/{id}/approve/` | Admin | Approve a pending user account. |
| PATCH | `/api/v1/admin/users/{id}/restrict/` | Admin | Restrict a user account. |
| DELETE | `/api/v1/admin/users/{id}/` | Admin | Soft-delete a user account. |

## 9. Angular Module Map

| Path | Responsibility |
|---|---|
| `src/app/core/services/` | Shared API client, auth state, cart service, payment service, and feature-facing HTTP helpers |
| `src/app/core/guards/` | Authentication and admin route protection |
| `src/app/core/interceptors/` | JWT token attachment and shared error handling |
| `src/app/core/models/` | Shared TypeScript interfaces for users, products, carts, orders, payments, and reviews |
| `src/app/shared/` | Reusable UI components, pipes, and directives |
| `src/app/layout/` | Header, footer, navigation, and application shell elements |
| `src/app/features/auth/` | Registration, email confirmation, login, logout, and session entry flows |
| `src/app/features/products/` | Product listing, search, filters, product detail, and stock state UI |
| `src/app/features/cart/` | Authenticated cart UI plus guest-cart local-storage behavior |
| `src/app/features/checkout/` | Checkout forms, guest checkout, payment-method selection, and order placement |
| `src/app/features/orders/` | Order confirmation and order detail views used after checkout |
| `src/app/features/profile/` | Basic current-user shell showing role, email confirmation state, and account status only |
| `src/app/features/admin/` | Admin user, catalog, order, payment, and review-moderation screens |
| `src/app/features/reviews/` | Review form, review list, and rating widgets embedded in product flows |

## 10. Django App Map

| App | Responsibility |
|---|---|
| `apps/users/` | Custom user model, account status, email confirmation, JWT integration, and current-user API |
| `apps/products/` | Categories, products, images, storefront selectors, search, filters, and stock state |
| `apps/cart/` | Authenticated cart and cart-item lifecycle with server-calculated summaries |
| `apps/orders/` | Authenticated and guest checkout, order creation, order items, and stock-safe order workflows |
| `apps/payments/` | Payment attempts, COD, wallet logic, provider webhook handling, and payment-status updates |
| `apps/reviews/` | Review CRUD, rating aggregates, and moderation visibility |
| `config/` | Settings, root URLs, and deployment entry points only |

## 11. Constraints and Assumptions

- Django and Angular versions will be team-approved current stable releases.
- All Django apps remain under `apps/`; no domain logic is placed in `config/`.
- Angular uses standalone components and a feature-based folder structure.
- PostgreSQL is the primary database.
- One online card provider is active for the first release: Stripe or PayPal.
- Guest cart state is frontend-managed until a guest submits checkout.
- Wallet funding is handled through seeded balances, admin operations, or future funding workflows; wallet top-up is outside the current release.
- Advanced profile management, order-history dashboards, shipping workflow management, and saved-card features are outside the core release.
- GitHub `main` and `develop` branches are protected and all feature work is merged through pull requests.

## 12. Future Work

- Social login (Google OAuth)
- Profile management with payment details
- Seller or vendor role and management
- Wishlist and favorites
- Order history and tracking with email notifications
- Order and shipping management
- Promo codes and discounts
- Card saving and auto-fill checkout
- Content management for banners and homepage sections
- Push notifications
- Email marketing and newsletters
- Loyalty programs and reward points
- Social media sharing and referral bonuses
- Multi-language support
- Advanced category management beyond basic CRUD
