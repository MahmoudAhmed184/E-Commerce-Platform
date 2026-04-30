# Contributing Guide

This project uses a small-branch, pull-request workflow. Keep changes focused, tested, and aligned with the SRS and task distribution documents.

## Workflow

1. Branch from `develop`.
2. Use the documented branch naming pattern.
3. Keep each branch limited to one feature slice, fix, test addition, or documentation update.
4. Open a draft pull request early when the work affects API contracts, shared models, settings, routing, or shared UI.
5. Link related issues or tasks using `Closes #<issue-number>` when the pull request resolves an issue.
6. Run the checks relevant to the files changed.
7. Update docs when behavior, requirements, setup, or API contracts change.
8. Request review from the owner of the affected area.
9. Squash merge into `develop` after approval and passing checks.

## Branch Naming

Use one of these patterns:

```text
feature/<area>-<short-name>
fix/<area>-<short-name>
test/<area>-<short-name>
docs/<short-name>
chore/<short-name>
```

Examples:

```text
feature/auth-registration
fix/cart-stock-validation
test/payment-webhooks
docs/api-contract
chore/backend-settings-split
```

## Commit Messages

Use Conventional Commit style:

```text
type(scope): short imperative summary
```

Accepted types:

- `feat`: user-facing or API-facing feature
- `fix`: bug fix
- `docs`: documentation only
- `test`: tests only
- `refactor`: behavior-preserving code change
- `chore`: repository, tooling, or maintenance
- `build`: build system or dependency changes
- `ci`: continuous integration changes

Examples:

```text
feat(auth): add email confirmation endpoint
fix(cart): reject quantities above available stock
docs: update checkout API contract
test(payments): cover webhook signature rejection
chore(server): split Django settings by environment
```

## Definition of Done

A change is ready for review when:

- It solves one clear task or bug.
- It follows the SRS, requirements checklist, and project conventions.
- Backend business logic is placed in services, and query logic is placed in selectors.
- Frontend feature logic stays in its feature directory, with shared infrastructure in `core/`.
- Tests are added or updated for meaningful behavior changes.
- API changes include permission checks, object-level authorization where applicable, and resource limits for list or bulk endpoints.
- Migrations are committed with related model changes.
- Docs are updated for setup, API, requirements, or workflow changes.
- No secrets, local `.env` files, generated caches, virtual environments, or dependency folders are committed.

## Local Checks

Backend:

```bash
cd server
uv sync
uv run python manage.py check
uv run python manage.py migrate
uv run pytest
```

Frontend:

```bash
cd client
npm install
npm run build
npm test
```

Run the subset that applies to the current change when the full suite is not available yet, and state any skipped checks in the pull request.

## Documentation Updates

Update the relevant document when a change affects scope or behavior:

- `docs/SRS.md` for API contracts, data models, architecture, and acceptance criteria
- `docs/requirements.md` for functional or non-functional checklist changes
- `docs/project_plan.md` for workflow, milestones, setup, or risk changes
- `docs/task_distribution.md` for ownership, estimates, and dependencies
- `README.md` for setup and repository-level onboarding
- `docs/CONVENTIONS.md` for coding and collaboration standards
