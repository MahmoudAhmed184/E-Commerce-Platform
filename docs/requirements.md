# requirements.md

## Stack Requirements Checklist

> Version: 1.0  
> Date: 2026-04-30  
> Status: Corrected consolidated draft

## 1. User Management

- [ ] FR-USR-001 The system shall register a customer using a unique email address, a unique phone number, and a password.
- [ ] FR-USR-002 The system shall reject registration when the email address is already assigned to another account.
- [ ] FR-USR-003 The system shall reject registration when the phone number is already assigned to another account.
- [ ] FR-USR-004 The system shall send a confirmation email after a successful registration request.
- [ ] FR-USR-005 The system shall confirm a user's email address using a valid confirmation token or link.
- [ ] FR-USR-006 The system shall prevent unconfirmed users from logging in.
- [ ] FR-USR-007 The system shall allow login with email and password.
- [ ] FR-USR-008 The system shall allow login with phone number and password.
- [ ] FR-USR-009 The system shall issue JWT access and refresh tokens after successful login.
- [ ] FR-USR-010 The system shall refresh an access token using a valid refresh token.
- [ ] FR-USR-011 The system shall log out a user by invalidating or blacklisting the submitted refresh token.
- [ ] FR-USR-012 The system shall support exactly two application roles: Customer and Admin.
- [ ] FR-USR-013 The system shall expose the authenticated user's identity, role, email confirmation state, and account status to the frontend.
- [ ] FR-USR-014 The system shall block pending-approval and restricted users from logging in and placing new orders.
- [ ] FR-USR-015 The system shall block soft-deleted users from logging in.

## 2. Product Catalog

- [ ] FR-PRD-001 The system shall provide a paginated list of active products.
- [ ] FR-PRD-002 Each product list item shall include name, primary image URL, price, category, and stock availability state.
- [ ] FR-PRD-003 The system shall provide product details including name, description, images, price, category, stock availability, average rating, and review count.
- [ ] FR-PRD-004 The system shall search products by product name.
- [ ] FR-PRD-005 The system shall filter products by category.
- [ ] FR-PRD-006 The system shall filter products by minimum and maximum price.
- [ ] FR-PRD-007 The system shall combine search, category filter, and price filter in one product listing request.
- [ ] FR-PRD-008 The system shall display out-of-stock products as unavailable for purchase.
- [ ] FR-PRD-009 The system shall store and serve product images through configured media storage.
- [ ] FR-PRD-010 The system shall require each product to belong to exactly one category.

## 3. Cart

- [ ] FR-CRT-001 The system shall allow an authenticated customer to add an in-stock product to a cart.
- [ ] FR-CRT-002 The system shall allow a guest user to maintain a frontend-managed cart for checkout without creating an account.
- [ ] FR-CRT-003 The system shall allow a user to increase or decrease cart item quantity.
- [ ] FR-CRT-004 The system shall allow a user to remove an item from the cart.
- [ ] FR-CRT-005 The system shall reject cart item quantities greater than available stock.
- [ ] FR-CRT-006 The system shall return a server-calculated cart summary for authenticated carts with line totals, subtotal, configured charges, and final total.

## 4. Checkout and Orders

- [ ] FR-CHK-001 The system shall show an order summary before order placement.
- [ ] FR-CHK-002 The system shall allow registered customers to place orders using their authenticated account.
- [ ] FR-CHK-003 The system shall allow guests to complete checkout without creating an account.
- [ ] FR-CHK-004 The system shall require guest checkout to collect email address, phone number, shipping address, and the payment details required by the selected payment method.
- [ ] FR-ORD-001 The system shall create an order and assign a unique order number.
- [ ] FR-ORD-002 The system shall create order items that snapshot product name, unit price, quantity, and line total at checkout time.
- [ ] FR-ORD-003 The system shall revalidate stock for every checkout line before order creation.
- [ ] FR-ORD-004 The system shall decrement product stock atomically after a valid order is created.
- [ ] FR-ORD-005 The system shall mark the converted authenticated cart as no longer active after successful order creation.
- [ ] FR-ORD-006 The system shall return order confirmation data including order number, items, totals, order status, and payment status.

## 5. Payments

- [ ] FR-PAY-001 The system shall support card payment through one configured provider: Stripe or PayPal.
- [ ] FR-PAY-002 The system shall support Cash on Delivery.
- [ ] FR-PAY-003 The system shall support Wallet payment.
- [ ] FR-PAY-004 The system shall reject Wallet payment when available wallet balance is insufficient.
- [ ] FR-PAY-005 The system shall create a payment record for each payment attempt.
- [ ] FR-PAY-006 The system shall store payment method, amount, status, provider, provider reference, and related order.
- [ ] FR-PAY-007 The system shall verify payment provider webhook signatures before updating payment or order state.
- [ ] FR-PAY-008 The system shall mark online paid orders as paid only after successful provider authorization, and failed or canceled online payments shall remain recoverable in an unpaid or failed state.
- [ ] FR-PAY-009 The system shall never store raw card numbers, CVV values, or full card payloads.
- [ ] FR-PAY-010 The system shall calculate final payment amount from server-side order data.

## 6. Admin

- [ ] FR-ADM-001 Admin users shall view a paginated list of registered users.
- [ ] FR-ADM-002 Admin users shall search users by email or phone number.
- [ ] FR-ADM-003 Admin users shall approve pending users.
- [ ] FR-ADM-004 Admin users shall restrict users.
- [ ] FR-ADM-005 Admin users shall soft-delete users without deleting historical orders or reviews.
- [ ] FR-ADM-006 Admin users shall create products.
- [ ] FR-ADM-007 Admin users shall update product name, description, price, category, images, and stock quantity.
- [ ] FR-ADM-008 Admin users shall deactivate products without deleting historical order data.
- [ ] FR-ADM-009 Admin users shall create, update, and deactivate categories.
- [ ] FR-ADM-010 Admin users shall view order and payment status for support and operations.
- [ ] FR-ADM-011 Admin users shall moderate product reviews by hiding or removing them from public display.
- [ ] FR-ADM-012 The system shall block non-admin users from admin API endpoints and admin UI routes.

## 7. Reviews

- [ ] FR-REV-001 Authenticated customers shall create a review for a product.
- [ ] FR-REV-002 The system shall enforce one active review per customer per product.
- [ ] FR-REV-003 Review ratings shall be integers from 1 to 5.
- [ ] FR-REV-004 A review shall allow optional written feedback.
- [ ] FR-REV-005 Customers shall edit their own reviews.
- [ ] FR-REV-006 Customers shall delete their own reviews.
- [ ] FR-REV-007 Customers shall view approved or visible reviews for each product.
- [ ] FR-REV-008 Product pages shall display average rating and review count.
- [ ] FR-REV-009 Customers shall not edit or delete reviews created by other users.

## 8. Non-Functional Requirements

### 8.1 Performance

- [ ] NFR-PER-001 List endpoints that can return many records shall use bounded pagination with a default page size.
- [ ] NFR-PER-002 Product search, category filter, price filter, and ownership lookup fields shall be indexed where supported by PostgreSQL.
- [ ] NFR-PER-003 API list responses shall avoid returning unnecessary detail-only fields.
- [ ] NFR-PER-004 Product images shall be returned by URL and shall not be embedded directly in JSON payloads.
- [ ] NFR-PER-005 API list endpoints shall respond within 500 ms under normal development or demo load.

### 8.2 Security

- [ ] NFR-SEC-001 Production traffic shall use HTTPS.
- [ ] NFR-SEC-002 Passwords shall be stored using Django's configured password hashing system.
- [ ] NFR-SEC-003 JWT access tokens shall be short-lived relative to refresh tokens.
- [ ] NFR-SEC-004 API input shall be validated server-side before database writes.
- [ ] NFR-SEC-005 CORS allowed origins shall be controlled by environment-specific settings.
- [ ] NFR-SEC-006 Rate limiting shall be applied to authentication, payment-sensitive, and review-submission endpoints.
- [ ] NFR-SEC-007 Secrets shall be loaded from environment variables and shall not be committed to Git.
- [ ] NFR-SEC-008 Uploaded product images shall be validated for allowed type and size.

### 8.3 Scalability and Maintainability

- [ ] NFR-MNT-001 Django apps shall live under the `apps/` directory.
- [ ] NFR-MNT-002 Django settings shall be split into `base.py`, `development.py`, `production.py`, and `testing.py`.
- [ ] NFR-MNT-003 Django business logic shall be implemented in `services.py`.
- [ ] NFR-MNT-004 Django query logic shall be implemented in `selectors.py`.
- [ ] NFR-MNT-005 Django views shall handle HTTP request and response orchestration only.
- [ ] NFR-MNT-006 Angular feature code shall live under `src/app/features/`.
- [ ] NFR-MNT-007 Angular guards, interceptors, API services, and shared models shall live under `src/app/core/`.
- [ ] NFR-MNT-008 Angular reusable UI components, pipes, and directives shall live under `src/app/shared/`.
- [ ] NFR-MNT-009 Python dependencies shall be managed with `uv`.
- [ ] NFR-MNT-010 Database migrations shall be committed with related model changes.

### 8.4 Testing

- [ ] NFR-TST-001 Backend services and selectors shall have automated tests.
- [ ] NFR-TST-002 API endpoints shall have integration tests covering successful and error paths.
- [ ] NFR-TST-003 Angular feature services shall have automated tests.
- [ ] NFR-TST-004 CI shall run backend tests, frontend tests, linting, and build checks on pull requests.

## 9. Future Work

The following items are explicitly out of scope for the current release:

- [ ] FUT-001 Social login (Google OAuth)
- [ ] FUT-002 Profile management with payment details
- [ ] FUT-003 Seller or vendor role and management
- [ ] FUT-004 Wishlist and favorites
- [ ] FUT-005 Order history and tracking with email notifications
- [ ] FUT-006 Order and shipping management
- [ ] FUT-007 Promo codes and discounts
- [ ] FUT-008 Card saving and auto-fill checkout
- [ ] FUT-009 Content management for banners and homepage sections
- [ ] FUT-010 Push notifications
- [ ] FUT-011 Email marketing and newsletters
- [ ] FUT-012 Loyalty programs and reward points
- [ ] FUT-013 Social media sharing and referral bonuses
- [ ] FUT-014 Multi-language support
- [ ] FUT-015 Advanced category management beyond basic CRUD
