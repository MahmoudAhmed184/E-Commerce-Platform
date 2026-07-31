# E-Commerce Platform

A full-stack online-store platform with a Django REST Framework API and an Angular single-page application. The current implementation covers identity, catalog discovery, cart and checkout workflows, orders, payments, reviews, and administrative operations.

## Current Capabilities

### Customer Experience

- Register with unique email and phone details
- Confirm email, sign in, refresh JWT access, and sign out
- Browse, search, filter, and inspect products and categories
- Maintain an authenticated cart with quantity and stock validation
- Complete registered or guest checkout
- Use Cash on Delivery, wallet, or sandbox card-payment workflows
- Review products and manage eligible reviews
- View the checkout result and order confirmation

### Administration

- Manage customers and account state
- Create and update categories, products, prices, stock, and images
- Review orders and payment records
- Moderate product reviews
- Access dedicated Angular administration screens

### Engineering

- Service and selector layers keep domain logic out of HTTP views
- Split Django settings for development, testing, and production
- JWT interceptors and route guards in Angular
- Environment-based database, CORS, email, and frontend configuration
- Backend unit/API tests and frontend component/service tests
- Shared requirements, API contracts, conventions, security guidance, and delivery plans

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Backend | Python 3.14, Django 6, Django REST Framework |
| Authentication | Simple JWT, email confirmation tokens |
| Data | MariaDB/MySQL by default; PostgreSQL driver available |
| Backend tooling | `uv`, pytest-django, Factory Boy, mypy/django-stubs |
| Frontend | Angular 21, TypeScript, RxJS, standalone components |
| Styling | Tailwind CSS 4 |
| Frontend testing | Vitest, jsdom, Playwright browser provider |

## Repository Structure

```text
.
├── client/                  # Angular application
│   └── src/app/
│       ├── core/            # Guards, interceptors, models, API/auth services
│       ├── features/        # Auth, products, cart, checkout, orders, reviews, admin
│       ├── layout/          # Header and footer
│       └── shared/          # Reusable loading/error components
├── server/                  # Django API
│   ├── apps/
│   │   ├── users/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── reviews/
│   │   └── admin_api/
│   └── config/              # Settings, URLs, ASGI, and WSGI
├── docs/                    # SRS, contracts, plans, and conventions
├── CONTRIBUTING.md
└── SECURITY.md
```

## Getting Started

### Prerequisites

- Git
- Python 3.14
- [`uv`](https://docs.astral.sh/uv/)
- Node.js 20+ and npm
- MariaDB/MySQL, or PostgreSQL with a matching `DB_ENGINE`

### Backend

```bash
git clone https://github.com/MahmoudAhmed184/E-Commerce-Platform.git
cd E-Commerce-Platform/server
cp .env.example .env
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

The API starts at `http://127.0.0.1:8000`.

Important backend environment groups are already documented in `server/.env.example`:

- `DJANGO_*` for application mode, secrets, and allowed hosts
- `DB_*` for database driver and credentials
- `CORS_ALLOWED_ORIGINS` and `FRONTEND_BASE_URL`
- `EMAIL_*` / `SMTP_*` for confirmation email

Do not commit the completed `.env` file.

Optional catalog seed data:

```bash
uv run python manage.py seed_products
```

### Frontend

In a second terminal:

```bash
cd E-Commerce-Platform/client
npm install
npm start
```

The Angular application starts at `http://localhost:4200`. Set `apiBaseUrl` in `client/src/environments/environment.ts` for local development and in the production environment file for builds. `client/.env.example` documents the desired future runtime variable, but Angular does not load that file automatically yet.

## API Overview

The API root is `/api/v1`.

| Domain | Representative routes |
| --- | --- |
| Identity | `POST /auth/register/`, `/auth/confirm-email/`, `/auth/login/`, `/auth/token/refresh/`, `/auth/logout/` |
| Current user | `GET /users/me/` |
| Catalog | `/products/categories/`, `/products/products/`, `/products/products/{slug}/` |
| Cart | `GET /cart/`, `POST /cart/items/`, `/cart/items/{item_id}/` |
| Orders | `/orders/` |
| Payments | `/payments/` and `/payments/webhooks/sandbox/` |
| Reviews | `/reviews/` and `/products/{product_slug}/reviews/` |
| Administration | `/admin/users/`, `/admin/orders/`, `/admin/payments/`, `/admin/reviews/`, and catalog admin routes |

The checked-in route modules under `server/apps/*/urls.py` are the source of truth. See [`docs/api_contract.md`](docs/api_contract.md) and [`docs/SRS.md`](docs/SRS.md) for request/response expectations and broader product requirements.

## Verification

### Backend

```bash
cd server
uv run python manage.py check
uv run python manage.py check_auth_security
uv run pytest
```

The backend suite covers identity models and services, authentication endpoints, cart behavior, checkout, catalog, reviews, and administrative APIs.

### Frontend

```bash
cd client
npm run lint
npm test
npm run build
```

Frontend tests cover interceptors, auth and admin services, login, product cards, product lists, and product details.

## Architecture Notes

Backend domains use the following separation where appropriate:

```text
URL -> view/viewset -> serializer -> service -> model
                              \-> selector (read composition)
```

- Views focus on HTTP orchestration.
- Services enforce state-changing business workflows.
- Selectors compose read queries and filtering.
- Serializers validate transport data and shape responses.
- Database constraints and transactions protect checkout, stock, and review rules.

The Angular client groups route-level functionality by feature and keeps authentication, HTTP behavior, and shared models under `core/`.

## Documentation

- [Project description](docs/project_description.md)
- [Requirements checklist](docs/requirements.md)
- [Software Requirements Specification](docs/SRS.md)
- [API contract](docs/api_contract.md)
- [Project plan](docs/project_plan.md)
- [Task distribution](docs/task_distribution.md)
- [Engineering conventions](docs/CONVENTIONS.md)
- [GitHub setup checklist](docs/GITHUB_SETUP.md)
- [Security policy](SECURITY.md)
- [Contribution guide](CONTRIBUTING.md)

## Team Workflow

Development uses feature branches from `develop` and pull requests with relevant backend/frontend verification. Follow the repository's documented branch and commit conventions before contributing.

## License

No license file is currently included in this repository.
