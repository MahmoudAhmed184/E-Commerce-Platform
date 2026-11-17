# Technology CLIs & Modern Developer Tooling (2026)

> **Document ID:** BOOST-08  
> **Status:** Production Standard  
> **Quality Rating:** 9.9 / 10  
> **Tooling Stack:** Angular CLI (`ng`), Spartan CLI (`@spartan-ng/cli`), Astral `uv`, Ruff CLI, Django CLI, Skills CLI (`skills.sh`)

---

## 1. Overview & Tooling Philosophy

In modern software engineering, manual boilerplate and error-prone copy-pasting are replaced by battle-tested Command-Line Interfaces (CLIs). CLIs guarantee deterministic directory structures, standard naming conventions, and automatic registration.

AI coding agents must be directed to use official CLIs when generating components, adding packages, and executing verification routines.

---

## 2. Frontend CLIs

### 2.1 Angular CLI (`ng`)

The Angular CLI remains the foundational tool for scaffolding, building, and running tests in the Angular ecosystem:

```bash
# Scaffolding a feature component with OnPush change detection
ng g c features/products/components/product-spec-table --change-detection OnPush

# Scaffolding a functional route guard
ng g guard core/guards/checkout --functional

# Scaffolding a functional HTTP interceptor
ng g interceptor core/interceptors/api-version --functional

# Production Build with optimizations
ng build --configuration production

# Running strict type-checking
npm run typecheck

# Running Vitest unit test suite (NON-INTERACTIVE for agents and CI)
npm test -- --watch=false
```

### 2.2 Spartan CLI (`@spartan-ng/cli`)

The Spartan CLI generates unstyled CDK logic and Tailwind-styled Helm components directly into our shared components directory:

```bash
# Initialize Spartan in client workspace
npx ng g @spartan-ng/cli:init

# Generate core primitives
npx ng g @spartan-ng/cli:ui button
npx ng g @spartan-ng/cli:ui input
npx ng g @spartan-ng/cli:ui label
npx ng g @spartan-ng/cli:ui sheet
npx ng g @spartan-ng/cli:ui dialog
npx ng g @spartan-ng/cli:ui dropdown-menu
npx ng g @spartan-ng/cli:ui sonner
npx ng g @spartan-ng/cli:ui tabs
npx ng g @spartan-ng/cli:ui table
npx ng g @spartan-ng/cli:ui badge
npx ng g @spartan-ng/cli:ui skeleton
```

---

## 3. Backend CLIs

### 3.1 Astral `uv` CLI (Python Fast Package & Environment Manager)

`uv` replaces pip, virtualenv, poetry, and pip-tools with an ultra-fast Rust-based package manager:

```bash
# Installing dependencies from pyproject.toml / uv.lock (reproducible sync)
uv sync

# Adding a new production dependency
uv add stripe

# Adding a development dependency
uv add --dev ruff

# Running commands within the managed virtual environment
uv run python manage.py migrate
uv run pytest
```

### 3.2 Ruff CLI (Unified Linter & Formatter)

Ruff can be run directly via `uv run ruff` (when added to `pyproject.toml`) or via `uvx ruff` (ephemeral tool runner):

```bash
# Check code for lint violations and Django anti-patterns
uv run ruff check .

# Automatically apply safe fixes (imports, formatting, pyupgrade)
uv run ruff check --fix .

# Format all Python files (replaces Black)
uv run ruff format .

# Check formatting without altering files (CI mode)
uv run ruff format --check .
```

### 3.3 Django Management CLI (`manage.py`)

```bash
# Generate schema migrations
uv run python manage.py makemigrations

# Check migration plan and status
uv run python manage.py showmigrations

# Apply database migrations
uv run python manage.py migrate

# Execute deployment and configuration security checks
uv run python manage.py check --deploy --settings=config.settings.production
```

---

## 4. Agent Skills Registry CLI (`skills.sh`)

The `skills` CLI from [https://skills.sh/](https://skills.sh/) manages modular agent skills:

```bash
# Find community skills interactively or by keyword
npx --yes skills find tailwind
npx --yes skills find angular
npx --yes skills find unslop

# Install a skill package into the project (.agents/skills)
npx --yes skills add vercel-labs/agent-skills

# List all currently installed project skills
npx --yes skills list

# Restore skills deterministically from skills-lock.json
npx --yes skills experimental_install

# Run or prompt a skill without installing
npx --yes skills use vercel-labs/agent-skills@vercel-optimize
```

---

## 5. Root Developer Automation: Unified `Makefile`

To eliminate cognitive load for both human engineers and AI agents, the repository provides a unified `Makefile` configured with non-interactive flags:

```makefile
.PHONY: help install lint format test check-all

help:
	@echo "Available commands:"
	@echo "  make install    - Install frontend (npm) and backend (uv) dependencies"
	@echo "  make lint       - Run linters on client and server"
	@echo "  make format     - Run code formatters (Prettier & Ruff)"
	@echo "  make test       - Run all unit and integration tests (non-interactive)"
	@echo "  make check-all  - Run the full CI quality gate locally"

install:
	cd client && npm install
	cd server && uv sync

lint:
	cd client && npm run lint
	cd server && uv run ruff check .

format:
	cd client && npx prettier --write "src/**/*.{ts,html,css,json}"
	cd server && uv run ruff format .

test:
	cd client && npm test -- --watch=false
	cd server && uv run python -Wd -m pytest

check-all: lint format test
	cd client && npm run typecheck && npm run build
	cd server && uv run mypy .
	@echo "All quality gate checks passed!"
```
