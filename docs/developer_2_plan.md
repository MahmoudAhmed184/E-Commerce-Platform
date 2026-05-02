# Developer 2 Implementation Plan

Based on the `docs/task_distribution.md`, here is the detailed phase-by-phase implementation plan for Developer 2 responsibilities.

## Phase 1: Setup and Infrastructure (In Progress)
**Task P1-SET-002: Backend scaffold**
- [x] **uv Configuration**: Verify `pyproject.toml` and `uv.lock` are set up.
- [x] **Settings Split**: Refactor `server/config/settings.py` into `settings/base.py`, `settings/local.py`, and `settings/production.py`.
- [x] **Database Setup**: Switch `DATABASES` from SQLite to PostgreSQL configuration (using environment variables).
- [x] **Static & Media**: Configure `STATIC_ROOT`, `STATIC_URL`, `MEDIA_ROOT`, and `MEDIA_URL`.
- [x] **Apps Registration**: Ensure all apps under `server/apps/` (`users`, `products`, `cart`, `orders`, `payments`, `reviews`) are registered in `INSTALLED_APPS`.
- [x] **Manage.py Update**: Update `manage.py` and `asgi.py`/`wsgi.py` to point to `config.settings.local` by default.

## Phase 2: Core Backend (Catalog)
**Task P2-BE-PRD-001: Product Models & Services**
- [x] **Models**: Create `Category`, `Product`, and `ProductImage` models in `apps/products/models.py`. Include fields like name, slug, description, price, stock, is_active, etc.
- [x] **Migrations**: Generate migrations for the new models.
- [x] **Admin**: Register models in Django Admin for easy testing.
- [x] **Services & Selectors**: Implement business logic for fetching and managing products and categories.

**Task P2-BE-PRD-002: Product APIs & Tests**
- [x] **Serializers**: Create serializers for Product, Category, and ProductImage.
- [x] **Views/ViewSets**: Build APIs for product listing, detail, search, category filtering, and price filtering.
- [x] **Tests**: Write unit and integration tests for the APIs.

**Task P2-BE-ADM-CAT-001: Admin Catalog APIs & Tests**
- [x] **Admin Views**: Build secure APIs (requiring admin auth) for CRUD operations on products, categories, and images.
- [x] **Stock Management**: API for updating stock status.
- [x] **Tests**: Write tests ensuring only authorized admins can access these endpoints.

## Phase 3: Core Frontend (Catalog)
**Task P3-FE-PRD-001: Products Feature in Angular**
- [x] **Services**: Create Angular services to communicate with the product APIs.
- [x] **Components**: 
  - Product Listing Page
  - Product Detail Page
  - Category and Price Filter components
  - Search Bar component
- [x] **State Management**: Integrate stock display and image handling.
- [x] **Tests**: Write Angular tests for the feature services.

## Phase 4: Integration
**Task P4-INT-PRD-001: Frontend-Backend Integration**
- [x] Connect the Angular catalog screens to the live Django APIs.
- [x] Implement image upload functionality from the admin catalog screens.
- [x] Handle stock-state validation and edge cases in the UI.

## Phase 5: Testing and Polish
**Task P5-QA-002: Backend Regression**
- [x] Write a regression suite for catalog and admin catalog.
- [x] Optimize database queries using `select_related` and `prefetch_related`.
- [x] Address query-performance edge cases (e.g., n+1 query problems in product listings).
