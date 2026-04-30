# E-Commerce

Full-stack e-commerce platform built with a Django backend and an Angular frontend.

This repository is in the initial scaffold phase. The current codebase contains a Django project created with `uv` and an Angular standalone workspace. The project documentation defines the target release scope, API contracts, architecture, delivery phases, and team ownership model.

## Table of Contents

- [Project Status](#project-status)
- [Core Scope](#core-scope)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Verification](#verification)
- [Architecture Notes](#architecture-notes)
- [API Contract Summary](#api-contract-summary)
- [Team Workflow](#team-workflow)
- [Documentation](#documentation)

## Project Status

Phase 1 is focused on repository readiness, backend and frontend scaffolds, shared contracts, and local development setup.

Current baseline:

- Django project scaffold under `server/`
- Python dependency management with `uv`
- Angular workspace scaffold under `client/`
- Planning, requirements, task distribution, and SRS documents under `docs/`
- Root README and Git ignore rules for local build output, virtual environments, and secrets

Planned Phase 1 additions from the documentation:

- Backend app skeletons under `server/apps/`
- Django settings split into `base.py`, `development.py`, `production.py`, and `testing.py`
- PostgreSQL configuration
- Media and static file configuration
- Angular `core/`, `shared/`, `layout/`, and `features/` folder structure
- Environment templates
- Shared API contract and sample payloads
- CI workflow for backend checks, frontend checks, linting, and builds

## Core Scope

The first release focuses on the following customer and admin workflows:

- Customer registration with unique email and phone number
- Email confirmation before login
- Login with email or phone number
- JWT access and refresh tokens
- Customer and Admin roles
- Product listing, product detail, search, filtering, categories, images, prices, and stock state
- Authenticated cart management
- Guest cart maintained on the frontend until checkout
- Registered and guest checkout
- Order creation with stock revalidation and order item snapshots
- Payments through one card provider, Cash on Delivery, and wallet balance
- Product reviews and ratings
- Admin user management, catalog management, order and payment visibility, and review moderation

The following features are documented as future work and are intentionally out of scope for the first release:

- Social login
- Seller/vendor management
- Wishlist and favorites
- Order tracking notifications
- Promo codes and discounts
- Saved cards and payment auto-fill
- Marketing notifications, newsletters, loyalty points, referrals, and multi-language support

## Technology Stack

Backend:

- Python 3.14
- Django 6
- `uv` for Python dependency and virtual environment management
- Planned: Django REST Framework, JWT authentication, PostgreSQL, CORS handling, filtering, image uploads, payment provider integration, and backend test tooling

Frontend:

- Angular 21
- TypeScript
- Standalone Angular components
- npm for frontend dependency management
- Planned: feature-based routing, guards, interceptors, shared models, API services, and frontend tests

Infrastructure and collaboration:

- Git and GitHub
- Feature branches from `develop`
- Pull requests with relevant backend or frontend verification
- Protected `main` and `develop` branches after the remote repository is configured

## Repository Structure

```text
.
├── client/
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── package-lock.json
├── docs/
│   ├── SRS.md
│   ├── project_description.md
│   ├── project_plan.md
│   ├── requirements.md
│   └── task_distribution.md
├── server/
│   ├── config/
│   ├── manage.py
│   ├── pyproject.toml
│   └── uv.lock
├── .gitignore
└── README.md
```

Target backend structure from the SRS:

```text
server/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── testing.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
└── apps/
    ├── users/
    ├── products/
    ├── cart/
    ├── orders/
    ├── payments/
    └── reviews/
```

Target frontend structure from the SRS:

```text
client/src/app/
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
└── features/
    ├── auth/
    ├── products/
    ├── cart/
    ├── checkout/
    ├── orders/
    ├── profile/
    ├── admin/
    └── reviews/
```

## Prerequisites

Install these tools before running the project locally:

- Git
- Python 3.14
- `uv`
- Node.js LTS and npm
- Angular CLI through `npx`
- PostgreSQL for the planned full backend setup

Check versions:

```bash
git --version
python --version
uv --version
node --version
npm --version
```

## Backend Setup

From the repository root:

```bash
cd server
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

The Django development server runs at:

```text
http://127.0.0.1:8000/
```

Current note: the initial scaffold still uses Django's default SQLite configuration. PostgreSQL and split settings are part of the documented Phase 1 backend setup.

Add backend dependencies with:

```bash
cd server
uv add <package-name>
uv add --dev <package-name>
uv sync
```

## Frontend Setup

From the repository root:

```bash
cd client
npm install
npm start
```

The Angular development server runs at:

```text
http://localhost:4200/
```

Run Angular CLI commands through `npx` when needed:

```bash
cd client
npx ng generate component features/products/pages/product-list
npx ng generate service core/services/api
```

## Verification

Backend:

```bash
cd server
uv run python manage.py check
```

Frontend:

```bash
cd client
npm run build
npm test
```

Expected future CI checks:

- Backend tests
- Backend linting and type checks
- Frontend tests
- Frontend build
- Pull request validation for changed backend or frontend areas

## Architecture Notes

Backend conventions from the SRS:

- Keep domain code under `server/apps/`
- Keep `config/` limited to settings, URLs, and deployment entry points
- Put business workflows in `services.py`
- Put read/query composition in `selectors.py`
- Keep views focused on HTTP request and response orchestration
- Commit database migrations with the related model changes
- Load secrets from environment variables; do not commit `.env` files

Frontend conventions from the SRS and Angular guidance:

- Use standalone components
- Keep feature code under `src/app/features/`
- Keep API services, guards, interceptors, and shared models under `src/app/core/`
- Keep reusable UI components, directives, and pipes under `src/app/shared/`
- Keep guest cart state local to the frontend until guest checkout submission
- Use lazy feature routes as the application grows

Security and data handling expectations:

- Passwords use Django's configured password hashing
- JWT access tokens are short-lived relative to refresh tokens
- Authentication, payment-sensitive, and review-submission endpoints should be rate-limited
- Card numbers, CVV values, and raw card payloads must never be stored
- Product image uploads should validate file type and size

## API Contract Summary

The API base path is planned as:

```text
/api/v1
```

Main endpoint groups:

- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/confirm-email/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/token/refresh/`
- `POST /api/v1/auth/logout/`
- `GET /api/v1/users/me/`
- `GET /api/v1/products/`
- `GET /api/v1/products/{id}/`
- `GET /api/v1/categories/`
- `GET /api/v1/cart/`
- `POST /api/v1/cart/items/`
- `POST /api/v1/orders/`
- `POST /api/v1/orders/guest/`
- `POST /api/v1/orders/{order_id}/payments/`
- `GET /api/v1/products/{product_id}/reviews/`
- Admin endpoints under `/api/v1/admin/`

See [docs/SRS.md](docs/SRS.md) for the full endpoint map, data model summary, and acceptance criteria.

## Team Workflow

Branch naming:

```text
main
develop
feature/<area>-<short-name>
fix/<area>-<short-name>
test/<area>-<short-name>
docs/<short-name>
```

Pull request flow:

1. Branch from `develop`.
2. Keep each branch limited to one feature slice or one tightly related fix.
3. Open draft pull requests early when work affects shared contracts.
4. Run the checks relevant to the changed files.
5. Update docs when API behavior, task ownership, or requirements change.
6. Squash merge into `develop`.
7. Merge `develop` into `main` only at release checkpoints.

Commit message style:

```text
type(scope): short imperative summary
```

Examples:

```text
docs: add software requirements specification
feat(server): scaffold Django project
feat(client): scaffold Angular workspace
chore: add repository ignore rules
```

## Documentation

- [Project description](docs/project_description.md): original stack project brief and feature expectations
- [Requirements checklist](docs/requirements.md): functional and non-functional checklist for implementation tracking
- [Software Requirements Specification](docs/SRS.md): scope, architecture, data models, API contracts, and constraints
- [Project execution plan](docs/project_plan.md): phases, milestones, branching strategy, setup plan, risks, and environment checklist
- [Task distribution](docs/task_distribution.md): developer ownership, estimates, dependencies, and phase-by-phase delivery plan
