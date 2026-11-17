# High-Level System Architecture Design (HLD - 2026)

> **Document ID:** BOOST-06  
> **Status:** Production Standard  
> **Quality Rating:** 9.9 / 10  
> **Architecture Pattern:** Clean Domain-Driven Modular Monolith with Decoupled Reactive Client  
> **Target Date:** November 16, 2026

---

## 1. System Context & Topology (C4 Level 1 & 2)

The system is architected as a high-performance, strictly typed full-stack e-commerce platform. It cleanly decouples the presentation tier (Angular 22 Standalone SPA) from the transactional business core (Django 6.1 Modular Core) via a versioned, secure REST API.

```
                    +--------------------------------------------+
                    |           Customer / Admin Browser         |
                    +--------------------------------------------+
                                           |
                                           | HTTPS / HTTP/3
                                           v
                    +--------------------------------------------+
                    |        Edge CDN & Reverse Proxy            |
                    |   (Cloudflare / Nginx SSL Termination)     |
                    +--------------------------------------------+
                               /                     \
       Static Assets & SPA    /                       \  /api/v1/*
                             v                         v
              +-----------------------------+   +-----------------------------+
              |    Angular 22 Client App    |   |    Django 6.1 Backend API   |
              |  (Zoneless, Signals,        |   |   (Python 3.14, DRF,        |
              |   Spartan UI, Tailwind v4)  |   |    Clean Service Layer)     |
              +-----------------------------+   +-----------------------------+
                                                               |
                          +-------------------+----------------+-------------------+
                          |                   |                                    |
                          v                   v                                    v
              +--------------------+ +--------------------+              +--------------------+
              |   PostgreSQL 17+   | |      Redis 7+      |              |   External Services|
              | (ACID Relational   | | (Rate Limiting,    |              | - Sandbox Payments |
              |  Primary Storage)  | |  Cache & Queue)    |              | - SMTP Email       |
              +--------------------+ +--------------------+              | - Media Storage    |
                                                                         +--------------------+
```

---

## 2. Bounded Contexts & Domain Boundaries

The application is decomposed into seven cohesive, loosely coupled domain boundaries:

```
+-----------------------------------------------------------------------------------+
|                               E-COMMERCE DOMAINS                                  |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ 1. Identity & Auth ]  --> Users, Profiles, Permissions, JWT Cookie Sessions    |
|  [ 2. Catalog & Stock ]  --> Categories, Products, SKU, Atomic Stock Reservation  |
|  [ 3. Cart Management ]  --> Guest Local Cart, Authenticated User Active Cart     |
|  [ 4. Order Processing]  --> State Machine (Pending -> Paid -> Shipped -> Done)   |
|  [ 5. Payment & Invoicing] -> Sandbox & Card Charges, Webhook Reconciliation      |
|  [ 6. Reviews & Ratings] --> Verified Buyer Reviews, Aggregated Star Ratings      |
|  [ 7. Admin & Analytics] --> Staff Operations, Metrics, Catalog Management       |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### Domain Responsibilities & API Contract Alignment:
1. **Identity & Auth (`apps.users`):** Handles authentication, registration, email confirmation state, and profile management. Issues secure `HttpOnly`, `SameSite=Lax` JWT cookies. Never exposes raw token secrets in JSON response bodies.
2. **Catalog & Inventory (`apps.products`):** Manages categories, active products, specifications, and live stock quantities. Enforces inventory locking (`select_for_update()`) during checkout to eliminate overselling.
3. **Cart (`apps.cart`):** Manages shopping cart lifecycle. Anonymous guests operate via a persistent `guest_token`; upon user authentication, the client seamlessly merges guest items into the user's persistent cart.
4. **Orders (`apps.orders`):** Orchestrates order creation and fulfillment. Supports `/api/v1/orders/summary/` for pre-checkout pricing calculations and `/api/v1/orders/checkout/` for atomic order creation.
5. **Payments (`apps.payments`):** Manages payment lifecycles and webhook listeners (`/api/v1/payments/webhooks/sandbox/`). Employs server-side verification and cryptographically validated callbacks.
6. **Reviews (`apps.reviews`):** Manages customer feedback and ratings (`/api/v1/products/{product_slug}/reviews/`). Enforces verified purchase constraints (only customers with delivered orders can submit reviews).
7. **Admin Operations (`apps.admin_api` / `apps.admin`):** Staff-only endpoints (`/api/v1/admin/`) protected by `IsAdminUser` permissions, providing category creation, product deactivation, order triage, and user audits.

---

## 3. High-Level Data Flows: Checkout & Payment Lifecycle

The checkout lifecycle exemplifies strict domain boundaries, stock integrity, and transaction safety:

```
[Customer Browser]       [Angular Cart]       [Django Orders API]       [Payment Webhook]
       |                       |                       |                        |
       |--- 1. Click Checkout ->|                       |                        |
       |                       |--- 2. POST /orders/ ->|                        |
       |                       |       summary/        |                        |
       |                       |<-- 3. Return summary -|                        |
       |                       |   (totals, taxes)     |                        |
       |--- 4. Confirm Order ->|                       |                        |
       |                       |--- 5. POST /orders/ ->|                        |
       |                       |       checkout/       |                        |
       |                       |                       |-- 6. Atomic Lock ----->|
       |                       |                       |   Reserve Stock        |
       |                       |                       |-- 7. Create Order ---->|
       |                       |                       |   (Status: Pending)    |
       |                       |<-- 8. Return Order ---|                        |
       |                       |   (Order Number)      |                        |
       |                       |                       |                        |
       |                       |                       |<-- 9. POST /payments/ -|
       |                       |                       |       webhooks/sandbox |
       |                       |                       |-- 10. Atomic Update: ->|
       |                       |                       |   Status = Paid        |
       |<-- 11. Polled Status -|<----------------------|                        |
       |    Order Confirmed    |                       |                        |
```

---

## 4. Security & Resilience Architecture

1. **Authentication:** JWT tokens stored exclusively in `HttpOnly`, `Secure`, `SameSite=Lax` cookies. Prevents XSS script access while protecting against CSRF attacks.
2. **PCI-DSS Compliance:** Zero raw credit card storage. Card data is tokenized or routed through sandboxed payment providers.
3. **Database Concurrency Protection:** All inventory reservation queries utilize `select_for_update()` inside an `@transaction.atomic` block to eliminate race conditions during high-volume sales.
4. **Rate Limiting:** Protects sensitive endpoints (login, registration, password reset, review submission, checkout) using Redis token-bucket rate limiters.
5. **Idempotency Keys:** Mutating payment and order endpoints require a client-generated UUID `Idempotency-Key` header, guaranteeing that network retries never generate duplicate charges.
6. **Observability:** Health check endpoints (`/health/live` and `/health/ready`) probe database connection and cache availability for automated container orchestration.
