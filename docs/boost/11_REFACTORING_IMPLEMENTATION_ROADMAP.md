# Phased Refactoring & Implementation Roadmap (2026)

> **Document ID:** BOOST-11  
> **Status:** Production Standard  
> **Quality Rating:** 9.9 / 10  
> **Target Timeline:** November 2026 Implementation Cycle  
> **Execution Strategy:** 5-Phase Gated Refactoring with Continuous Verification

---

## 1. Overview & Phased Migration Strategy

Refactoring a full-stack production application requires strict ordering to avoid regressing active features. We execute the transformation in **5 distinct, verifiable phases**:

```
[Phase 1: Tooling & Quality Gates]
                |
                v
[Phase 2: Tailwind v4 & Spartan UI Scaffolding]
                |
                v
[Phase 3: Frontend Angular 22 Signals & Unslop Redesign]
                |
                v
[Phase 4: Backend Django 6.1 Service Layer & Async]
                |
                v
[Phase 5: End-to-End Verification & CI Enforcement]
```

---

## 2. Phase Breakdown

### Phase 1: Tooling, Linting & Git Pre-Commit Gates
**Objective:** Lock in quality enforcement before application code is modified.
1. **Frontend ESLint:** Apply the strict flat configuration documented in [BOOST-01](file:///home/mahmoud-ahmed/Projects/E-Commerce/docs/boost/01_LINTING_QUALITY_ENFORCEMENT.md) to `client/eslint.config.js`, adding template accessibility and `strictTypeChecked` rules.
2. **Backend Ruff & Mypy:** Add `ruff` to `server/pyproject.toml` dev-dependencies and configure `flake8-django` (`DJ`), pyupgrade (`UP`), and bugbear (`B`) rules alongside strict `mypy` settings.
3. **Pre-commit Automation:** Configure `.pre-commit-config.yaml` to run formatters and linters on staged files.
- *Verification Gate:* Run `npm run lint` and `uv run ruff check .` across the codebase; resolve any baseline violations.

### Phase 2: Tailwind v4 Tokens & Spartan UI Initialization
**Objective:** Establish the design system foundation and component primitives.
1. **Tailwind v4 Theme:** Update `client/src/styles.css` with the quiet graphite neutral ramp and Spartan variable mappings outlined in [BOOST-05](file:///home/mahmoud-ahmed/Projects/E-Commerce/docs/boost/05_TAILWIND_LATEST_STANDARDS_V4.md).
2. **Spartan CLI Setup:** Install `@spartan-ng/cli` and initialize `@spartan-ng/helm` components under `client/src/app/shared/components/spartan/`:
   ```bash
   cd client
   npm install -D @spartan-ng/cli
   npx ng g @spartan-ng/cli:init
   npx ng g @spartan-ng/cli:ui button input label badge sheet dialog dropdown-menu sonner tabs table
   ```
- *Verification Gate:* Compile Tailwind stylesheet and verify Spartan Helm primitives build cleanly with `npm run build`.

### Phase 3: Frontend Signals Migration & Storefront Unslopping
**Objective:** Modernize Angular state to Signals and apply the 9-Pass Unslop redesign.
1. **Zoneless Verification:** Validate that `provideZonelessChangeDetection()` in `client/src/app/app.config.ts` functions flawlessly without `zone.js`.
2. **Component Migration:** Replace custom wrappers (`<app-button>`, `<app-input-control>`, `<app-sheet>`) with Spartan directives (`hlmBtn`, `hlmInput`, `HlmSheet`).
3. **Unslop Redesign:** Apply the 9-Pass polish ([BOOST-10](file:///home/mahmoud-ahmed/Projects/E-Commerce/docs/boost/10_UNSLOP_WEBSITE_POLISH_PLAN.md)) to Global Nav, Homepage Hero, Catalog Grid, Product Detail, and Checkout screens.
- *Verification Gate:* `npm run typecheck && npm run lint && npm test -- --watch=false && npm run build`.

### Phase 4: Backend Service-Layer & Async Modernization
**Objective:** Eliminate fat models/views and enforce strict domain boundaries.
1. **Service Layer Refactoring:** Audit `server/apps/` (orders, cart, products, users) to ensure all mutations occur in `services.py` inside `@transaction.atomic` blocks with `select_for_update()` stock locking.
2. **Selectors:** Verify that all database reads and prefetching queries reside in `selectors.py`.
3. **DRF Typing:** Update DRF serializers with strict typing verified by `mypy`.
- *Verification Gate:* `uv run mypy . && uv run python manage.py check && uv run python -Wd -m pytest`.

### Phase 5: End-to-End Quality Gate & CI Pipeline
**Objective:** Enforce continuous verification across the entire repository.
1. **GitHub Actions Workflow:** Update `.github/workflows/ci.yml` to execute lint, typecheck, unit tests, and build checks in parallel for both frontend and backend.
2. **Agent Documentation:** Deploy root `AGENTS.md` and custom skills to guide all future agent operations.
- *Verification Gate:* Full local execution of `make check-all` passing with zero warnings.

---

## 3. Definition of Done (DoD)

A refactoring task is considered complete only when:
- [x] Zero ESLint warnings or errors (`npm run lint`).
- [x] Zero TypeScript typechecking errors (`npm run typecheck`).
- [x] Zero Ruff linter or formatting errors (`uv run ruff check .` & `uv run ruff format --check .`).
- [x] Zero Mypy type violations (`uv run mypy .`).
- [x] 100% of unit and integration tests pass (`npm test -- --watch=false` & `uv run python -Wd -m pytest`).
- [x] Production build completes without warnings (`npm run build`).
- [x] All UI screens adhere to the 9-Pass Unslop design standard (quiet graphite chrome, 4px grid, single accent, no AI slop).
