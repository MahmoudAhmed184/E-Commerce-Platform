# Vendra Client

Professional Angular frontend for the E-Commerce platform. This application provides the customer storefront, account flows, cart and checkout workflows, order confirmation, review management, profile management, and the admin operations workspace for catalog, user, order, payment, and review administration.

The frontend is built as a standalone Angular application with lazy feature routes, strict TypeScript, token-driven Tailwind CSS styling, functional HTTP interceptors, route guards, reusable UI primitives, and service-layer response validation.

## Table of Contents

- [Overview](#overview)
- [Current Scope](#current-scope)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Application Routes](#application-routes)
- [Feature Details](#feature-details)
- [Project Structure](#project-structure)
- [Architecture Notes](#architecture-notes)
- [API Integration](#api-integration)
- [Shared UI System](#shared-ui-system)
- [Testing and Quality](#testing-and-quality)
- [Development Guidelines](#development-guidelines)
- [Troubleshooting](#troubleshooting)
- [Maintenance Checklist](#maintenance-checklist)

## Overview

Vendra Client is the browser application for the full-stack e-commerce project. It connects to the Django REST API, renders the public storefront, supports guest and authenticated shopping, manages checkout state, and exposes protected admin tools for operational workflows.

Primary goals:

- Provide a responsive shopping experience across desktop and mobile.
- Keep frontend workflows aligned with backend API contracts.
- Use strict typing and runtime validation for API responses.
- Keep UI behavior accessible, predictable, and testable.
- Separate customer-facing features from admin operations through lazy routes and guards.

## Current Scope

Implemented frontend areas:

- Storefront home page and product catalog.
- Product search, filters, sort order, pagination, category navigation, product detail pages, image galleries, stock state, and reviews.
- Customer registration, email confirmation, login, logout, current-user loading, protected routes, and session refresh handling.
- Guest cart persisted in the browser and authenticated cart synchronized with the backend.
- Checkout review, delivery, and payment pages.
- Order placement with idempotency key handling and order confirmation display.
- Product review listing, creation, editing, and deletion.
- Customer profile view and profile update form.
- Admin dashboard, users, products, categories, orders/payments, and review moderation.
- Shared UI component system backed by project design tokens.
- Unit tests for routes, services, guards, interceptors, pages, workflows, models, and shared components.

Security note: frontend route guards and disabled UI states are convenience layers only. Authentication, authorization, stock checks, pricing, payment rules, and order permissions must remain enforced by the backend.

## Technology Stack

| Area | Tooling |
| --- | --- |
| Framework | Angular 21 |
| Language | TypeScript with strict compiler options |
| UI model | Standalone components, lazy routes, signals, computed state, reactive forms |
| Styling | Tailwind CSS v4, custom design tokens, CSS utilities |
| Icons | `@lucide/angular` |
| HTTP | Angular `HttpClient`, functional interceptors, cookie credentials |
| Tests | Angular unit-test builder, Vitest packages, Playwright browser support |
| Linting | Angular ESLint, TypeScript ESLint |
| Package manager | npm, pinned as `npm@11.13.0` in `package.json` |

## Prerequisites

Install these before running the frontend locally:

- Node.js LTS.
- npm compatible with the checked-in lockfile.
- Git.
- A running backend API for full application behavior.

Recommended version checks:

```bash
node --version
npm --version
git --version
```

The app can boot without the backend, but API-backed screens will show loading failures until the Django server is running and reachable.

## Quick Start

From the repository root:

```bash
cd client
npm install
npm start
```

Open:

```text
http://localhost:4200/
```

For a full local stack, run the backend separately at:

```text
http://localhost:8000/
```

The frontend development environment expects API requests at:

```text
http://localhost:8000/api/v1
```

## Environment Configuration

Angular currently uses compile-time environment files.

| File | Purpose | API base URL |
| --- | --- | --- |
| `src/environments/environment.ts` | Local development | `http://localhost:8000/api/v1` |
| `src/environments/environment.production.ts` | Production build replacement | `/api/v1` |
| `.env.example` | Documentation template only | `NG_APP_API_BASE_URL=http://127.0.0.1:8000/api/v1` |

Important details:

- `.env.example` is not loaded by `ng serve`.
- Local API URL changes should be made in `src/environments/environment.ts`.
- Production builds replace `environment.ts` with `environment.production.ts`.
- `ApiService` prefixes every API path with `environment.apiBaseUrl`.
- Requests use `withCredentials: true`, so backend CORS and cookie settings must allow the Angular origin.

## Available Scripts

Run commands from `client/`.

| Command | Description |
| --- | --- |
| `npm start` | Starts the Angular development server. |
| `npm run build` | Creates a production build using Angular's production configuration. |
| `npm run watch` | Builds in watch mode with the development configuration. |
| `npm test` | Runs unit tests through `scripts/ng-test-compat.mjs`. |
| `npm run typecheck` | Runs TypeScript checks for app and spec projects. |
| `npm run lint` | Runs Angular ESLint for TypeScript and templates. |
| `npm run ci` | Runs typecheck, lint, tests, and production build. |

The test wrapper in `scripts/ng-test-compat.mjs` maps older `ChromeHeadless` arguments to Chromium headless flags for compatibility with existing test commands.

## Application Routes

### Public and Customer Routes

| Route | Access | Description |
| --- | --- | --- |
| `/` | Public | Storefront home page with featured products, new arrivals, and categories. |
| `/products` | Public | Catalog listing with search, filters, sorting, pagination, and quick add. |
| `/products/:slug` | Public | Product detail page with gallery, stock state, quantity selection, details, policies, and reviews. |
| `/cart` | Public | Guest or authenticated cart review with quantity editing and removal. |
| `/checkout` | Public | Redirects to `/checkout/review`. |
| `/checkout/review` | Public | Checkout item review before delivery details. |
| `/checkout/delivery` | Public | Delivery and contact form for guest and authenticated checkout. |
| `/checkout/payment` | Public | Payment method selection and order placement. |
| `/orders` | Public by route, backend-controlled by API | Order lookup and authenticated customer order history. |
| `/orders/:orderNumber` | Public by route, backend-controlled by API | Order confirmation and status display. |
| `/orders/:orderNumber/confirmation` | Public by route, backend-controlled by API | Alternate order confirmation URL. |
| `/reviews/:slug` | Public read, authenticated write | Product reviews list and customer review actions. |
| `/profile` | Authenticated | Customer profile workspace. |

### Authentication Routes

| Route | Description |
| --- | --- |
| `/auth/login` | Login with email or phone identifier and password. |
| `/auth/register` | Customer registration with field validation. |
| `/auth/confirm-email` | Confirmation pending page and token confirmation flow. |
| `/auth/confirm-pending` | Alias for the confirmation pending page. |

### Admin Routes

| Route | Access | Description |
| --- | --- | --- |
| `/admin` | Admin | Admin shell and dashboard metrics. |
| `/admin/users` | Admin | User search, pagination, sorting, approval, restriction, soft delete, and bulk actions. |
| `/admin/orders` | Admin | Orders and payments workspace with detail sheet and status actions. |
| `/admin/payments` | Admin | Alias of the orders/payments workspace. |
| `/admin/products` | Admin | Product create/edit/delete, visibility, stock, category assignment, and image uploads. |
| `/admin/categories` | Admin | Category create/edit/delete with product-count guardrails. |
| `/admin/reviews` | Admin | Review moderation with hide, restore, and delete actions. |

### Error Routes

| Route | Description |
| --- | --- |
| `/error` | Server or permission error page. |
| `**` | Not found page. |

## Feature Details

### Storefront and Catalog

- Global navigation with desktop menu, mobile sheet, account menu, cart count, product search, and admin link for admin users.
- Skip-navigation component for keyboard users.
- Home page backed by catalog API data.
- Featured and new-arrival product collections.
- Category cards linked to product listing filters.
- Catalog query state synchronized with URL query parameters.
- Search suggestions, active filter chips, category selection, price range filter, sort selection, pagination, and mobile filter sheet.
- Product card component with image, price, rating, stock badge, sale label, and quick add-to-cart.
- Product detail page with image gallery, breadcrumbs, quantity stepper, stock validation messaging, tabs for highlights/description/specs, policy accordion, and deferred review display.

### Authentication and Session

- Register form validates name, email, phone, password length, password digit, and password confirmation.
- Login supports email or phone identifier.
- Login redirects back to the originally requested protected route through `returnUrl`.
- Email confirmation supports both pending and token-confirmation states.
- Current user is loaded during application initialization.
- Authenticated routes use `authGuard`.
- Admin routes use both `authGuard` and `adminGuard`.
- `authInterceptor` retries eligible API `401` responses with `/auth/token/refresh/`.
- Requests can opt out of auth or refresh handling with `SKIP_AUTH` and `SKIP_REFRESH`.
- Session timeout modal supports extension, sign out, and draft-preservation messaging.

### Cart

- Guest cart is stored in `localStorage` under `guest_cart`.
- Authenticated cart cache is stored in `localStorage` under `auth_cart`.
- Cart count is exposed through `CartService.itemCount`.
- Guest cart lines include product id, slug, name, image, price, quantity, and available stock.
- Authenticated cart operations call backend cart endpoints.
- Guest items synchronize into the server cart when an authenticated cart is loaded after login.
- Cart page supports loading, empty, error, quantity update, remove, and checkout transition states.

### Checkout

- Checkout flow is split into review, delivery, and payment routes.
- Shared checkout stepper communicates progress across the flow.
- Review step allows item quantity edits and item removal.
- Delivery step captures required shipping/contact fields and guest email when needed.
- Payment step supports:
  - Card.
  - Cash on delivery.
  - Wallet for authenticated users.
- Cash on delivery requires an explicit confirmation dialog.
- Wallet is disabled for guests.
- Order placement uses `CheckoutService.placeOrder`.
- Checkout requests include an `Idempotency-Key` header.
- Successful checkout clears delivery draft state and both guest/auth cart state.

### Orders

- Order confirmation loads the order by order number.
- Order history lists authenticated customer orders and keeps guest lookup available by order number.
- Displays order status, payment status, line items, subtotal, shipping, tax, discount, total, contact details, and delivery address.
- Provides support copy with the order number.
- Handles loading and not-found/error states.

### Reviews

- Product detail pages show review summaries and review cards.
- Reviews route supports loading all visible reviews for a product.
- Authenticated users can create, edit, and delete their own reviews.
- Review form validates rating.
- Admin review moderation supports search, hide, restore, and delete.

### Profile

- Protected profile route loads the current user when needed.
- Profile summary displays avatar, email, phone, role, and status badges.
- Profile form updates full name and phone number.
- Email is displayed as read-only.
- Address and preference tabs are present as placeholders until persistent backend profile extensions are available.

### Admin Workspace

- Admin shell provides desktop sidebar navigation and mobile navigation sheet.
- Dashboard aggregates users, orders, payments, products, and reviews into metrics and an attention queue.
- Users workspace supports backend search, backend pagination, client-side sorting, selection, approval, restriction, soft delete, and bulk approval/restriction.
- Products workspace supports list/search/sort, create/edit, validation, category assignment, stock and price fields, visibility toggles, delete confirmation, selection, bulk visibility actions, and product image upload.
- Categories workspace supports list, create, edit, delete confirmation, and delete prevention for categories containing products.
- Orders/payments workspace supports combined order/payment search, order detail sheet, order confirmation, order cancellation, and recent payment activity.
- Reviews workspace supports review search and moderation actions.

## Project Structure

```text
client/
├── angular.json
├── eslint.config.js
├── package.json
├── scripts/
│   └── ng-test-compat.mjs
├── src/
│   ├── app/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── app.ts
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   └── <guard-name>/
│   │   │   ├── interceptors/
│   │   │   │   └── <interceptor-name>/
│   │   │   ├── models/
│   │   │   │   └── <model-name>/
│   │   │   └── services/
│   │   │       └── <service-name>/
│   │   ├── features/
│   │   │   ├── admin/
│   │   │   │   ├── admin.routes.ts
│   │   │   │   ├── pages/
│   │   │   │   └── services/
│   │   │   │       └── <service-name>/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── pages/
│   │   │   │   └── services/
│   │   │   │       └── <service-name>/
│   │   │   ├── cart/
│   │   │   │   ├── cart.routes.ts
│   │   │   │   ├── components/
│   │   │   │   └── pages/
│   │   │   ├── checkout/
│   │   │   │   ├── checkout.routes.ts
│   │   │   │   ├── components/
│   │   │   │   ├── pages/
│   │   │   │   └── services/
│   │   │   │       └── <service-name>/
│   │   │   ├── orders/
│   │   │   │   ├── orders.routes.ts
│   │   │   │   ├── components/
│   │   │   │   └── pages/
│   │   │   ├── products/
│   │   │   │   ├── products.routes.ts
│   │   │   │   ├── components/
│   │   │   │   ├── pages/
│   │   │   │   └── services/
│   │   │   │       └── <service-name>/
│   │   │   ├── profile/
│   │   │   │   ├── profile.routes.ts
│   │   │   │   └── pages/
│   │   │   └── reviews/
│   │   │       ├── reviews.routes.ts
│   │   │       ├── components/
│   │   │       ├── pages/
│   │   │       └── services/
│   │   │           └── <service-name>/
│   │   ├── layout/
│   │   └── shared/
│   │       ├── components/
│   │       ├── directives/
│   │       └── pipes/
│   ├── environments/
│   ├── styles/
│   │   └── tokens.css
│   ├── styles.css
│   └── test-setup.ts
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json
```

Key files:

- `src/app/app.routes.ts`: top-level lazy route tree.
- `src/app/app.config.ts`: router, HTTP interceptors, async animations, and app initializer.
- `src/app/app.ts`: root shell with global nav, footer, skip navigation, router outlet, and session timeout modal.
- `src/app/core/services/api/api.service.ts`: API base URL, query params, headers, and credential handling.
- `src/app/core/services/auth/auth.service.ts`: auth state, login/register/logout, session refresh, current user, profile updates, and session modal state.
- `src/app/core/services/cart/cart.service.ts`: guest cart, authenticated cart, cart persistence, cart sync, and item count.
- `src/app/core/services/checkout/checkout.service.ts`: checkout draft state, order payload creation, idempotency key, and order API calls.
- `src/app/core/models/runtime-validation/runtime-validation.ts`: defensive parsing helpers for unknown API responses.
- `src/app/features/*/*.routes.ts`: feature-owned lazy route definitions at the feature root.
- `src/app/features/*/services/<service-name>/`: feature workflow services and facades, grouped with their specs.
- `src/styles.css`: Tailwind import, token mapping, and shared utilities.
- `src/styles/tokens.css`: design system tokens for color, typography, spacing, layout, radius, shadows, motion, and z-index.
- `src/test-setup.ts`: memory-backed storage fallback for tests.

## Architecture Notes

### Routing

The app uses Angular lazy loading for feature routes. Top-level feature routes are defined in `app.routes.ts`, and each feature owns its own route file where appropriate. This keeps initial bundle scope smaller and keeps feature ownership clear.

### State Management

The app uses Angular signals for local and service-owned UI state:

- `signal()` for mutable component/service state.
- `computed()` for derived state.
- `toSignal()` where router or observable state needs to be consumed in templates.
- Reactive forms for complex form state and validation.

No external state-management library is currently used.

### API Boundary

Components should not call `HttpClient` directly. API access is centralized in core services, while feature workflow services/facades orchestrate UI-specific flows:

- `CatalogPageDataService` maps product/category/review data into catalog view models.
- `ProductCartWorkflowService` coordinates add-to-cart behavior for guest and authenticated users.
- `AuthFlowService` maps auth errors into form-friendly messages.
- `CheckoutPaymentWorkflowService` handles payment preflight and order-placement outcomes.
- `AdminWorkflowService` coordinates admin dashboard, category, product, image upload, and visibility flows.
- `AdminUsersFacade` owns users table state and user actions.

### Error Handling

- `errorInterceptor` maps most HTTP failures into `AppError`.
- `authInterceptor` leaves eligible `401` responses raw long enough for refresh handling.
- UI pages display error banners, empty states, retry actions, and not-found states where appropriate.
- Runtime validation errors are raised when backend responses do not match expected frontend contracts.

### Accessibility

The UI includes:

- Skip navigation.
- Semantic route-level headings.
- Keyboard-visible focus rings.
- Accessible labels for controls and navigation.
- ARIA busy/live/invalid states where relevant.
- Dialog and sheet primitives for modal interactions.
- Empty, loading, and error states that remain understandable to assistive technology.

## API Integration

All paths below are prefixed with `environment.apiBaseUrl`.

| Domain | Endpoints |
| --- | --- |
| Auth | `/auth/register/`, `/auth/confirm-email/`, `/auth/login/`, `/auth/logout/`, `/auth/token/refresh/` |
| Current user | `/users/me/` |
| Products | `/products/products/`, `/products/products/:slug/` |
| Categories | `/products/categories/` |
| Cart | `/cart/`, `/cart/items/`, `/cart/items/:id/` |
| Checkout and orders | `/orders/checkout/`, `/orders/`, `/orders/:orderNumber/` |
| Payments | `/payments/card/elements/`, `/payments/card/confirm/`, `/payments/wallet/pay/`, `/payments/cod/confirm/` |
| Reviews | `/products/:slug/reviews/`, `/reviews/:id/` |
| Admin users | `/admin/users/`, `/admin/users/:id/approve/`, `/admin/users/:id/restrict/`, `/admin/users/:id/` |
| Admin orders/payments | `/admin/orders/`, `/admin/orders/:id/`, `/admin/payments/` |
| Admin products | `/products/admin/products/`, `/products/admin/products/:slug/`, `/products/admin/products/:slug/update_stock/`, `/products/admin/products/:slug/deactivate/` |
| Admin product images | `/products/admin/product-images/` |
| Admin categories | `/products/admin/categories/`, `/products/admin/categories/:slug/` |
| Admin reviews | `/admin/reviews/`, `/admin/reviews/:id/hide/`, `/admin/reviews/:id/unhide/`, `/admin/reviews/:id/` |

## Shared UI System

Reusable shared components live under `src/app/shared/components`.

Current component groups:

- Layout and overlays: `dialog`, `sheet`, `sidebar`, `dropdown-menu`, `navigation-menu`, `tabs`, `accordion`, `tooltip`.
- Feedback: `alert-banner`, `alert-dialog`, `empty-state`, `error-state`, `skeleton-loader`, `spinner`, `progress`, `sonner`.
- Forms: `button`, `input`, `textarea`, `select`, `combobox`, `checkbox`, `radio`, `toggle`, `field`, `input-control`, `input-group`, `search-bar`, `price-range-control`, `quantity-stepper`, `file-upload`.
- Commerce UI: `product-card`, `cart-item-row`, `order-summary-card`, `payment-method-selector`, `image-gallery`, `star-rating`, `review-card`, `badge`, `chip`, `avatar`, `pagination`.

Component conventions:

- Standalone Angular components.
- `input()` and `output()` APIs.
- OnPush change detection.
- Signals and computed values for local view state.
- Token-backed Tailwind utility classes.
- Accessible labels and states for interactive elements.

## Testing and Quality

The client currently includes 118 spec files under `src/app`.

Run the full frontend verification suite:

```bash
npm run ci
```

Run checks individually:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Quality gates covered by `npm run ci`:

- TypeScript app project type checking.
- TypeScript spec project type checking.
- Angular ESLint for TypeScript and templates.
- Unit tests.
- Production build.

Recommended before submitting frontend changes:

1. Run focused tests for the files you changed.
2. Run `npm run typecheck`.
3. Run `npm run lint`.
4. Run `npm test`.
5. Run `npm run build`.
6. Run `npm run ci` before opening or updating a pull request.

## Development Guidelines

- Prefer standalone components and feature-owned lazy routes.
- Keep route pages focused on orchestration and page layout.
- Put reusable visual primitives in `shared/components`.
- Put backend data access in `core/services`.
- Put feature-specific workflow logic in feature services or facades.
- Use strict TypeScript types and avoid `any`.
- Parse unknown backend responses before exposing them to components.
- Use Angular signals for local UI state and reactive forms for forms.
- Preserve product listing state in URL query parameters.
- Keep backend permission and business-rule enforcement authoritative.
- Avoid storing sensitive payment data in the browser.
- Update this README when scripts, environment behavior, routes, API dependencies, or major workflows change.

## Troubleshooting

### API requests fail locally

Confirm that the backend is running and that `src/environments/environment.ts` points to the correct API base URL:

```text
http://localhost:8000/api/v1
```

Also confirm that backend CORS and cookie settings allow:

```text
http://localhost:4200
```

### Login succeeds but protected pages still redirect

Check that the browser is accepting backend cookies and that requests are sent with credentials. `ApiService` and the auth interceptor set `withCredentials: true`, but the backend must return compatible cookie attributes for local development.

### Guest cart does not appear after login

Guest cart sync happens when the authenticated cart loads. Visit `/cart` after login or trigger a cart load through a checkout page. If local storage has stale data, clear `guest_cart` and retry.

### Tests fail because storage is unavailable

`src/test-setup.ts` installs memory-backed `localStorage` and `sessionStorage` if the test environment does not provide them. Confirm the test target still includes `src/test-setup.ts` in `angular.json`.

### Production build uses the wrong API URL

Production builds use `src/environments/environment.production.ts`. Update that file or the deployment proxy so `/api/v1` resolves to the backend.

## Maintenance Checklist

When adding or changing frontend functionality:

- Update route docs if a route is added, removed, renamed, protected, or redirected.
- Update API docs if a service starts using new backend endpoints.
- Add or update tests for changed services, guards, workflows, pages, or shared components.
- Keep user-facing workflows documented under [Feature Details](#feature-details).
- Keep environment and script docs aligned with `angular.json`, `package.json`, and `src/environments`.
- Run `npm run ci` before handing off changes.
