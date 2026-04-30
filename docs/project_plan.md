# project_plan.md

## Stack Project Execution Plan

> Version: 1.0  
> Date: 2026-04-30  
> Status: Corrected consolidated draft

## 1. Project Phases

| Phase | Goal | Deliverables | Estimated Duration | Dependencies |
|---|---|---|---|---|
| Phase 1 - Setup and Infrastructure | Establish repository standards, scaffolds, shared contracts, and local development readiness. | Protected `main` and `develop` branches, Django scaffold under `config/` and `apps/`, Angular standalone workspace with feature folders, PostgreSQL connectivity, CI baseline, API contract draft, and environment templates. | 3 to 5 working days | None |
| Phase 2 - Core Backend | Implement Django domain models, services, selectors, APIs, and backend tests for all in-scope backend features. | `users`, `products`, `cart`, `orders`, `payments`, and `reviews` apps, admin APIs, service and selector tests, and API integration tests. | 2 sprints | Phase 1 |
| Phase 3 - Core Frontend | Implement Angular user and admin flows against the agreed API contract using standalone components. | `auth`, `products`, `cart`, `checkout`, `orders`, `profile`, `admin`, and `reviews` features, plus core services, guards, interceptors, and frontend tests. | 2 sprints, overlapping Phase 2 after the API contract is approved | Phase 1 and the Phase 1 API contract deliverable |
| Phase 4 - Integration | Connect live backend and frontend flows and verify shared boundaries. | Integrated auth, catalog, cart, guest checkout, payment, review, and admin workflows, sandbox payment verification, and defect fixes from integration. | 1 sprint | Phases 2 and 3 |
| Phase 5 - Testing and Polish | Remove release blockers, complete regression coverage, and prepare handoff. | Green CI, regression pass, security and performance review, updated docs, demo data, and release checklist. | 1 sprint | Phase 4 |

## 2. Milestones

| Milestone | Completion Criterion |
|---|---|
| M1 - Repository Ready | `main` and `develop` are protected, every developer can clone the repo, and the contribution workflow is documented. |
| M2 - Local Scaffolds Ready | `uv sync` succeeds, Django starts locally, Angular starts locally, and PostgreSQL connectivity is confirmed. |
| M3 - API Contract Approved | The SRS API tables, model names, auth flow, and core request and response shapes are committed and reviewed by backend and frontend owners. |
| M4 - Auth Ready | Registration, email confirmation, login, refresh, logout, current-user lookup, and admin user approval and restriction work with tests. |
| M5 - Catalog Ready | Products, categories, images, search, filters, pagination, and admin catalog operations work through API and UI. |
| M6 - Cart and Checkout Ready | Authenticated cart, guest-cart behavior, guest checkout, order creation, stock revalidation, and order confirmation work end to end. |
| M7 - Payments Ready | Card provider flow, COD, wallet payment, webhook verification, and payment-status updates work in sandbox mode. |
| M8 - Admin and Reviews Ready | Review CRUD and moderation work, and admin screens expose users, catalog data, orders, and payments. |
| M9 - Release Candidate Ready | Backend and frontend verification pass in CI, critical defects are closed, docs are current, and seeded demo data supports the main walkthrough. |

## 3. GitHub Branching Strategy

### 3.1 Branch Naming

| Branch Type | Pattern | Example |
|---|---|---|
| Main branch | `main` | `main` |
| Integration branch | `develop` | `develop` |
| Feature branch | `feature/<area>-<short-name>` | `feature/auth-registration` |
| Bug-fix branch | `fix/<area>-<short-name>` | `fix/cart-stock-validation` |
| Test branch | `test/<area>-<short-name>` | `test/payment-webhooks` |
| Docs branch | `docs/<short-name>` | `docs/api-contract` |

### 3.2 Pull Request Flow

1. Branch from `develop`.
2. Keep each branch limited to one feature slice or one tightly related fix.
3. Open a draft pull request early when the work affects shared contracts or shared files.
4. Require at least one reviewer before merge.
5. Require passing backend or frontend checks relevant to the changed files.
6. Update the SRS or task references when endpoint behavior or ownership changes.
7. Squash merge into `develop`.
8. Merge `develop` into `main` only at release checkpoints.

### 3.3 Merge Rules

- No direct pushes to `main` or `develop`
- No secrets or local `.env` files committed to Git
- No business logic in `config/`
- No Angular feature logic outside `src/app/features/`
- No backend service or selector changes merged without tests
- No Angular service changes merged without tests or explicit risk sign-off
- Database model changes and migration files must be reviewed together

## 4. Backend Setup with uv

### 4.1 Initial Project Setup

```bash
mkdir stack-backend
cd stack-backend

uv init
uv add django djangorestframework djangorestframework-simplejwt psycopg[binary] django-cors-headers django-filter pillow python-dotenv stripe
uv add --dev pytest pytest-django ruff mypy django-stubs djangorestframework-stubs model-bakery coverage

uv run django-admin startproject config .
mkdir -p apps/users apps/products apps/cart apps/orders apps/payments apps/reviews
touch apps/__init__.py

uv run python manage.py startapp users apps/users
uv run python manage.py startapp products apps/products
uv run python manage.py startapp cart apps/cart
uv run python manage.py startapp orders apps/orders
uv run python manage.py startapp payments apps/payments
uv run python manage.py startapp reviews apps/reviews

uv sync
```

If PayPal is selected instead of Stripe, replace the Stripe SDK dependency with the chosen PayPal SDK or approved REST client before the payment implementation starts.

### 4.2 Required Backend Structure

```text
stack-backend/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── testing.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── apps/
│   ├── users/
│   ├── products/
│   ├── cart/
│   ├── orders/
│   ├── payments/
│   └── reviews/
├── static/
├── media/
├── templates/
├── tests/
├── docs/
├── pyproject.toml
└── uv.lock
```

### 4.3 Daily Team Workflow

```bash
cd stack-backend
uv sync
uv run python manage.py migrate
uv run pytest
uv run ruff check .
uv run mypy .
uv run python manage.py runserver
```

### 4.4 Package Changes

```bash
cd stack-backend
uv add <package-name>
uv add --dev <dev-package-name>
uv sync
```

## 5. Angular Workspace Setup

### 5.1 Initial Workspace Setup

```bash
npx @angular/cli@latest new stack-frontend --routing --style=scss --standalone --strict
cd stack-frontend
npx ng generate environments

mkdir -p src/app/core/services
mkdir -p src/app/core/guards
mkdir -p src/app/core/interceptors
mkdir -p src/app/core/models
mkdir -p src/app/shared/components
mkdir -p src/app/shared/pipes
mkdir -p src/app/shared/directives
mkdir -p src/app/layout
mkdir -p src/app/features/auth
mkdir -p src/app/features/products
mkdir -p src/app/features/cart
mkdir -p src/app/features/checkout
mkdir -p src/app/features/orders
mkdir -p src/app/features/profile
mkdir -p src/app/features/admin
mkdir -p src/app/features/reviews

npx ng generate component layout/header --standalone
npx ng generate component layout/footer --standalone
npx ng generate component layout/navigation --standalone
npx ng generate component features/products/pages/product-list --standalone
npx ng generate component features/products/pages/product-detail --standalone
npx ng generate component features/cart/pages/cart --standalone
npx ng generate service core/services/api
npx ng generate service core/services/auth
npx ng generate interceptor core/interceptors/jwt
```

### 5.2 Frontend Development Workflow

```bash
cd stack-frontend
npm install
npx ng serve
npx ng test
npx ng build
```

### 5.3 Frontend Conventions

- Keep all screen and feature logic in `src/app/features/<feature>/`
- Keep shared infrastructure in `src/app/core/`
- Keep reusable UI-only assets in `src/app/shared/`
- Use standalone components for new screens and shared widgets
- Keep guest-cart state local to the frontend until guest checkout submission

## 6. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Payment provider setup or webhook verification takes longer than expected. | Medium | High | Freeze the provider decision early, isolate provider-specific logic in `apps/payments`, and validate sandbox webhook handling before UI integration is considered complete. |
| R2 | Backend and frontend drift away from the agreed API contract during parallel work. | High | High | Treat the SRS API tables as the source of truth, require draft PRs for contract changes, and review cross-stack changes before merge. |
| R3 | Authentication, role checks, and admin permissions are implemented inconsistently. | Medium | High | Centralize permission classes, add permission tests, and route all admin endpoints through `/api/v1/admin/`. |
| R4 | Stock and payment race conditions produce inconsistent order states. | Medium | High | Centralize order placement in backend services, wrap stock and payment transitions in transactions, and add targeted regression tests for concurrent checkout behavior. |
| R5 | Shared-file collisions slow the team down. | Medium | Medium | Keep ownership boundaries explicit, avoid unrelated refactors, and coordinate changes to shared files such as `app.routes.ts`, shared models, and root URL configuration. |
| R6 | Test coverage is deferred until late in the schedule. | Medium | High | Make tests part of each task definition and block merges for high-risk auth, checkout, stock, and payment changes without verification. |
| R7 | Scope creeps into future-work items. | Medium | Medium | Keep future work explicitly excluded in planning, and reject pull requests that add out-of-scope features without a scope decision. |

## 7. Development Environment Checklist

- [ ] Git is installed and configured
- [ ] GitHub repository access is granted for all developers
- [ ] Python version compatible with the selected Django version is installed
- [ ] `uv` is installed and available on `PATH`
- [ ] Node.js LTS and npm are installed
- [ ] Angular CLI is available through `npx`
- [ ] PostgreSQL is installed locally or available through the agreed local service workflow
- [ ] Local database and database user are created
- [ ] Backend `.env` is created from `.env.example` and excluded from Git
- [ ] Frontend environment files contain the local API base URL
- [ ] Stripe or PayPal sandbox credentials are available for payment work
- [ ] Email backend settings are available for confirmation-email testing
- [ ] `uv sync`, backend tests, Angular tests, and Angular build run locally
- [ ] Backend server starts with `uv run python manage.py runserver`
- [ ] Frontend server starts with `npx ng serve`

## 8. Future Work Excluded from This Plan

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
