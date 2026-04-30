# task_distribution.md

## Stack Task Distribution

> Version: 1.0  
> Date: 2026-04-30  
> Team Size: 5 developers  
> Status: Corrected consolidated draft

## Allocation Principles

- Phase 1 setup tasks are parallelizable from day one.
- Every backend app in scope has an explicit owner.
- Every Angular feature in scope has an explicit owner.
- Shared-boundary tasks name their cross-team dependencies directly.
- Estimated hours include implementation, local verification, and task-level tests.
- Workloads are balanced within 15% across the five developers.

## Phase 1 - Setup and Infrastructure

| Task ID | Title | Track | Requirement IDs | Estimated Hours | Assigned To | Dependencies |
|---|---|---|---|---:|---|---|
| P1-SET-001 | Repository standards, branch protections, pull-request template, README skeleton, `.gitignore`, and backend and frontend environment templates | DevOps | NFR-MNT-010, NFR-TST-004 | 8 | Developer 1 | None |
| P1-SET-002 | Backend scaffold with `uv`, Django project creation, settings split, PostgreSQL configuration, media and static paths, and app skeletons under `apps/` | DevOps / Backend | NFR-MNT-001, NFR-MNT-002, NFR-MNT-009 | 10 | Developer 2 | None |
| P1-SET-003 | Angular standalone workspace scaffold, feature-folder layout, environments, and base routing shell | DevOps / Frontend | NFR-MNT-006, NFR-MNT-007, NFR-MNT-008 | 8 | Developer 3 | None |
| P1-SET-004 | Shared API contract draft, sample payloads, mock data, and integration conventions | Architecture | FR-USR-001, FR-PRD-001, FR-CRT-001, FR-CHK-001, FR-PAY-001, FR-ADM-001, FR-REV-001 | 8 | Developer 4 | Depends on: P1-SET-001 |
| P1-SET-005 | CI workflow for backend tests, frontend tests, lint checks, and build verification | DevOps | NFR-TST-001, NFR-TST-002, NFR-TST-003, NFR-TST-004 | 8 | Developer 5 | Depends on: P1-SET-002, P1-SET-003 |

## Phase 2 - Core Backend

| Task ID | Title | Track | Requirement IDs | Estimated Hours | Assigned To | Dependencies |
|---|---|---|---|---:|---|---|
| P2-BE-USR-001 | Build `users` models, account statuses, roles, soft-delete fields, current-user serializer shape, services, and selectors | Backend | FR-USR-001, FR-USR-002, FR-USR-003, FR-USR-012, FR-USR-013, FR-USR-014, FR-USR-015 | 12 | Developer 1 | Depends on: P1-SET-002 |
| P2-BE-USR-002 | Build registration, email confirmation, login by email or phone, JWT refresh, logout, and auth tests | Backend | FR-USR-004, FR-USR-005, FR-USR-006, FR-USR-007, FR-USR-008, FR-USR-009, FR-USR-010, FR-USR-011 | 10 | Developer 1 | Depends on: P2-BE-USR-001, P1-SET-004 |
| P2-BE-SEC-001 | Implement permissions, throttling, CORS settings, serializer validation, password hashing checks, and security tests | Backend | FR-ADM-012, NFR-SEC-001, NFR-SEC-002, NFR-SEC-003, NFR-SEC-004, NFR-SEC-005, NFR-SEC-006, NFR-SEC-007, NFR-SEC-008 | 8 | Developer 1 | Depends on: P2-BE-USR-002 |
| P2-BE-PRD-001 | Build `products` category, product, and product-image models, migrations, services, and selectors | Backend | FR-PRD-009, FR-PRD-010, FR-ADM-006, FR-ADM-007, FR-ADM-009 | 10 | Developer 2 | Depends on: P1-SET-002 |
| P2-BE-PRD-002 | Build product listing, detail, search, price filter, category filter, stock status APIs, and tests | Backend | FR-PRD-001, FR-PRD-002, FR-PRD-003, FR-PRD-004, FR-PRD-005, FR-PRD-006, FR-PRD-007, FR-PRD-008, NFR-PER-001, NFR-PER-002, NFR-PER-003, NFR-PER-004, NFR-PER-005 | 10 | Developer 2 | Depends on: P2-BE-PRD-001, P1-SET-004 |
| P2-BE-ADM-CAT-001 | Build admin product, category, product-image, and stock-management APIs with tests | Backend | FR-ADM-006, FR-ADM-007, FR-ADM-008, FR-ADM-009 | 8 | Developer 2 | Depends on: P2-BE-PRD-001, P2-BE-SEC-001 |
| P2-BE-CRT-001 | Build authenticated cart models, item APIs, stock validation, summary logic, and tests | Backend | FR-CRT-001, FR-CRT-003, FR-CRT-004, FR-CRT-005, FR-CRT-006, FR-PRD-008 | 10 | Developer 3 | Depends on: P1-SET-002, P2-BE-PRD-001 |
| P2-BE-ORD-001 | Build authenticated checkout, guest checkout, order item snapshots, order summaries, stock transaction logic, and tests | Backend | FR-CHK-001, FR-CHK-002, FR-CHK-003, FR-CHK-004, FR-ORD-001, FR-ORD-002, FR-ORD-003, FR-ORD-004, FR-ORD-005, FR-ORD-006 | 12 | Developer 3 | Depends on: P2-BE-CRT-001, P2-BE-PRD-002, P2-BE-USR-001 |
| P2-BE-PAY-001 | Build payment model, COD flow, wallet flow, wallet ledger, payment amount calculation, and card-payment orchestration with tests | Backend | FR-PAY-001, FR-PAY-002, FR-PAY-003, FR-PAY-004, FR-PAY-005, FR-PAY-006, FR-PAY-010 | 12 | Developer 4 | Depends on: P2-BE-ORD-001, P2-BE-USR-001 |
| P2-BE-PAY-002 | Build provider webhook endpoints, signature verification, recoverable failure handling, idempotent status updates, and payment integration tests | Backend | FR-PAY-007, FR-PAY-008, FR-PAY-009, NFR-SEC-006 | 8 | Developer 4 | Depends on: P2-BE-PAY-001 |
| P2-BE-REV-001 | Build review model, one-active-review rule, review CRUD APIs, rating aggregates, moderation support, and tests | Backend | FR-REV-001, FR-REV-002, FR-REV-003, FR-REV-004, FR-REV-005, FR-REV-006, FR-REV-007, FR-REV-008, FR-REV-009, FR-ADM-011 | 10 | Developer 5 | Depends on: P2-BE-PRD-001, P2-BE-USR-001 |
| P2-BE-ADM-OPS-001 | Build admin user list and search, approve, restrict, soft-delete, order and payment status, and review-moderation APIs with tests | Backend | FR-ADM-001, FR-ADM-002, FR-ADM-003, FR-ADM-004, FR-ADM-005, FR-ADM-010, FR-ADM-011, FR-ADM-012 | 12 | Developer 5 | Depends on: P2-BE-USR-001, P2-BE-ORD-001, P2-BE-PAY-002, P2-BE-REV-001 |

## Phase 3 - Core Frontend

| Task ID | Title | Track | Requirement IDs | Estimated Hours | Assigned To | Dependencies |
|---|---|---|---|---:|---|---|
| P3-FE-AUTH-001 | Build `auth` and `profile` features: registration, login by email or phone, email confirmation, logout, current-user status shell, and auth service tests | Frontend | FR-USR-001, FR-USR-004, FR-USR-005, FR-USR-007, FR-USR-008, FR-USR-009, FR-USR-010, FR-USR-011, FR-USR-013, FR-USR-014, FR-USR-015 | 14 | Developer 1 | Depends on: P1-SET-003, P1-SET-004, P2-BE-USR-002 |
| P3-FE-PRD-001 | Build `products` feature: product listing, product detail, image display, search, category filter, price filter, stock display, and feature-service tests | Frontend | FR-PRD-001, FR-PRD-002, FR-PRD-003, FR-PRD-004, FR-PRD-005, FR-PRD-006, FR-PRD-007, FR-PRD-008, FR-PRD-009 | 14 | Developer 2 | Depends on: P1-SET-003, P1-SET-004, P2-BE-PRD-002 |
| P3-FE-CORE-001 | Build `core` and `layout`: API client, environment config, JWT interceptor, error interceptor, auth guard, admin guard, shared models, and app shell | Frontend | FR-USR-009, FR-USR-010, FR-USR-013, FR-ADM-012, NFR-MNT-007 | 10 | Developer 3 | Depends on: P1-SET-003, P1-SET-004 |
| P3-FE-CART-001 | Build authenticated cart screen, guest-cart local-storage service, add and remove and update-quantity flows, cart summary, and cart-service tests | Frontend | FR-CRT-001, FR-CRT-002, FR-CRT-003, FR-CRT-004, FR-CRT-005, FR-CRT-006 | 10 | Developer 3 | Depends on: P3-FE-CORE-001, P3-FE-PRD-001, P2-BE-CRT-001 |
| P3-FE-CHECK-001 | Build `checkout` and `orders` features: guest checkout, order summary UI, payment-method selection, wallet balance display, order confirmation, and tests | Frontend | FR-CHK-001, FR-CHK-002, FR-CHK-003, FR-CHK-004, FR-ORD-001, FR-ORD-002, FR-ORD-003, FR-ORD-004, FR-ORD-006, FR-PAY-001, FR-PAY-002, FR-PAY-003, FR-PAY-004, FR-PAY-005, FR-PAY-006, FR-PAY-008 | 16 | Developer 4 | Depends on: P3-FE-CART-001, P2-BE-ORD-001, P2-BE-PAY-001 |
| P3-FE-ADMIN-001 | Build `admin` feature: users, products, categories, orders, payments, stock, and review-moderation screens plus tests | Frontend | FR-ADM-001, FR-ADM-002, FR-ADM-003, FR-ADM-004, FR-ADM-005, FR-ADM-006, FR-ADM-007, FR-ADM-008, FR-ADM-009, FR-ADM-010, FR-ADM-011, FR-ADM-012 | 12 | Developer 5 | Depends on: P3-FE-CORE-001, P2-BE-ADM-CAT-001, P2-BE-ADM-OPS-001 |
| P3-FE-REV-001 | Build `reviews` feature: create, edit, delete, list review UI, rating widgets, and feature-service tests | Frontend | FR-REV-001, FR-REV-002, FR-REV-003, FR-REV-004, FR-REV-005, FR-REV-006, FR-REV-007, FR-REV-008, FR-REV-009 | 8 | Developer 5 | Depends on: P3-FE-PRD-001, P2-BE-REV-001 |

## Phase 4 - Integration

| Task ID | Title | Track | Requirement IDs | Estimated Hours | Assigned To | Dependencies |
|---|---|---|---|---:|---|---|
| P4-INT-AUTH-001 | Integrate auth frontend with backend, verify JWT refresh and logout, role guards, and pending, restricted, and soft-deleted account handling | Integration | FR-USR-001, FR-USR-005, FR-USR-007, FR-USR-008, FR-USR-009, FR-USR-010, FR-USR-011, FR-USR-013, FR-USR-014, FR-USR-015, FR-ADM-012 | 8 | Developer 1 | Depends on: P2-BE-SEC-001, P3-FE-AUTH-001 |
| P4-INT-PRD-001 | Integrate catalog and admin catalog screens with live APIs, including image upload and stock-state validation | Integration | FR-PRD-001, FR-PRD-002, FR-PRD-003, FR-PRD-004, FR-PRD-005, FR-PRD-006, FR-PRD-007, FR-PRD-008, FR-PRD-009, FR-PRD-010, FR-ADM-006, FR-ADM-007, FR-ADM-008, FR-ADM-009 | 6 | Developer 2 | Depends on: P2-BE-ADM-CAT-001, P3-FE-PRD-001, P3-FE-ADMIN-001 |
| P4-INT-CART-ORD-001 | Integrate authenticated cart, guest-cart submission, checkout summary, registered checkout, guest checkout, and stock-edge cases | Integration | FR-CRT-001, FR-CRT-002, FR-CRT-003, FR-CRT-004, FR-CRT-005, FR-CRT-006, FR-CHK-001, FR-CHK-002, FR-CHK-003, FR-CHK-004, FR-ORD-001, FR-ORD-002, FR-ORD-003, FR-ORD-004, FR-ORD-005, FR-ORD-006 | 8 | Developer 3 | Depends on: P2-BE-ORD-001, P3-FE-CART-001, P3-FE-CHECK-001 |
| P4-INT-PAY-001 | Integrate payment UI with backend payments, verify COD, wallet, card-provider sandbox, webhook status updates, and recoverable failure states | Integration | FR-PAY-001, FR-PAY-002, FR-PAY-003, FR-PAY-004, FR-PAY-005, FR-PAY-006, FR-PAY-007, FR-PAY-008, FR-PAY-009, FR-PAY-010 | 10 | Developer 4 | Depends on: P2-BE-PAY-002, P3-FE-CHECK-001 |
| P4-INT-ADMIN-REV-001 | Integrate admin workflows, review moderation, order and payment support screens, and cross-flow bug triage | Integration | FR-ADM-001, FR-ADM-002, FR-ADM-003, FR-ADM-004, FR-ADM-005, FR-ADM-006, FR-ADM-007, FR-ADM-008, FR-ADM-009, FR-ADM-010, FR-ADM-011, FR-ADM-012, FR-REV-001, FR-REV-005, FR-REV-006, FR-REV-007, FR-REV-008, FR-REV-009 | 8 | Developer 5 | Depends on: P2-BE-ADM-OPS-001, P3-FE-ADMIN-001, P3-FE-REV-001, P4-INT-AUTH-001, P4-INT-PRD-001, P4-INT-CART-ORD-001, P4-INT-PAY-001 |

## Phase 5 - Testing and Polish

| Task ID | Title | Track | Requirement IDs | Estimated Hours | Assigned To | Dependencies |
|---|---|---|---|---:|---|---|
| P5-QA-001 | Security review, release-checklist updates, auth regression, and deployment-documentation updates | QA / Docs | NFR-SEC-001, NFR-SEC-002, NFR-SEC-003, NFR-SEC-004, NFR-SEC-005, NFR-SEC-006, NFR-SEC-007, NFR-SEC-008, NFR-TST-004 | 6 | Developer 1 | Depends on: P4-INT-AUTH-001, P4-INT-PAY-001 |
| P5-QA-002 | Backend regression suite for catalog, admin catalog, and query-performance edge cases | QA | FR-PRD-001, FR-PRD-002, FR-PRD-003, FR-PRD-004, FR-PRD-005, FR-PRD-006, FR-PRD-007, FR-PRD-008, FR-ADM-006, FR-ADM-007, FR-ADM-008, FR-ADM-009, NFR-PER-001, NFR-PER-002, NFR-PER-003, NFR-PER-004, NFR-PER-005 | 6 | Developer 2 | Depends on: P4-INT-PRD-001 |
| P5-QA-003 | Frontend regression suite and UX polish for cart, checkout, and order-confirmation flows | QA | FR-CRT-001, FR-CRT-002, FR-CRT-003, FR-CRT-004, FR-CRT-005, FR-CRT-006, FR-CHK-001, FR-CHK-002, FR-CHK-003, FR-CHK-004, FR-ORD-001, FR-ORD-004, FR-ORD-006 | 8 | Developer 3 | Depends on: P4-INT-CART-ORD-001, P4-INT-PAY-001 |
| P5-QA-004 | Final payment and checkout regression, sandbox verification, demo-data validation, and handoff for payment-support flows | QA | FR-PAY-001, FR-PAY-002, FR-PAY-003, FR-PAY-004, FR-PAY-005, FR-PAY-006, FR-PAY-007, FR-PAY-008, FR-PAY-009, FR-PAY-010, FR-ORD-006 | 8 | Developer 4 | Depends on: P4-INT-PAY-001 |
| P5-QA-005 | End-to-end release-candidate pass, admin and review bug triage, and handoff notes | QA / Docs | FR-ADM-001, FR-ADM-002, FR-ADM-003, FR-ADM-004, FR-ADM-005, FR-ADM-010, FR-ADM-011, FR-ADM-012, FR-REV-001, FR-REV-002, FR-REV-003, FR-REV-004, FR-REV-005, FR-REV-006, FR-REV-007, FR-REV-008, FR-REV-009, NFR-TST-001, NFR-TST-002, NFR-TST-003, NFR-TST-004 | 6 | Developer 5 | Depends on: P4-INT-ADMIN-REV-001, P5-QA-001, P5-QA-002, P5-QA-003, P5-QA-004 |

## Workload Summary

| Developer | Total Estimated Hours |
|---|---:|
| Developer 1 | 66 |
| Developer 2 | 64 |
| Developer 3 | 66 |
| Developer 4 | 62 |
| Developer 5 | 64 |

## Responsibility Overview

| Developer | Primary Ownership |
|---|---|
| Developer 1 | Auth backend, auth frontend, security, and release-checklist review |
| Developer 2 | Backend scaffold, catalog backend, catalog frontend, and admin catalog integration |
| Developer 3 | Frontend foundation, cart frontend, cart and order backend, and cart-order regression |
| Developer 4 | API contract ownership, payments backend, checkout and orders frontend, and payment integration |
| Developer 5 | CI, reviews backend, admin backend, admin frontend, and release-candidate coordination |

## Shared-Boundary Dependency Notes

- `P3-FE-AUTH-001` depends on `P2-BE-USR-002` because login, confirmation, and current-user payloads must match the backend contract.
- `P3-FE-CART-001` depends on `P3-FE-CORE-001` and `P2-BE-CRT-001` because authenticated cart behavior and local guest-cart behavior share frontend state boundaries.
- `P3-FE-CHECK-001` depends on `P2-BE-ORD-001` and `P2-BE-PAY-001` because guest checkout, order placement, and payment state share the same boundary.
- `P4-INT-CART-ORD-001` depends on `P3-FE-CHECK-001` and `P2-BE-ORD-001` because guest-cart submission is resolved only during order integration.
- `P4-INT-PAY-001` depends on `P3-FE-CHECK-001` and `P2-BE-PAY-002` because webhook-driven payment state changes must be reflected correctly in checkout and confirmation UI.
- `P3-FE-ADMIN-001` depends on `P2-BE-ADM-CAT-001` and `P2-BE-ADM-OPS-001` because catalog-admin screens and user, order, payment, and moderation screens are backed by different backend slices.

## Future Work Not Assigned

The following scope remains intentionally excluded from the current workload plan:

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
