# Project Conventions and Standards

## Repository Standards

- `main` is the release branch.
- `develop` is the integration branch.
- Feature, fix, test, docs, and chore work should happen on short-lived branches.
- Pull requests should be small enough to review in one pass.
- Shared contracts must be updated in the same change that changes behavior.
- Generated dependency folders, virtual environments, local caches, build output, and secrets must not be committed.
- Configure GitHub branch protection for `main` and `develop` after the remote repository is created.
- Configure CODEOWNERS only after real GitHub usernames or teams with write access are available.

## Branch Naming

```text
feature/<area>-<short-name>
fix/<area>-<short-name>
test/<area>-<short-name>
docs/<short-name>
chore/<short-name>
```

Use lowercase words separated by hyphens.

## Commit Message Standard

Use Conventional Commits:

```text
type(scope): short imperative summary
```

Examples:

```text
feat(products): add category filter
fix(auth): block unconfirmed user login
docs: update local setup instructions
test(orders): cover checkout stock revalidation
chore(client): update Angular dependencies
```

Keep commits focused. Do not mix unrelated backend, frontend, docs, and formatting changes unless they are part of the same task.

## Pull Request Standard

Every pull request should include:

- Summary of the change
- Linked task, issue, or requirement IDs when available
- Test commands run
- Screenshots or recordings for user interface changes
- Migration notes for database changes
- API contract notes for request or response changes
- Security notes for authentication, authorization, payments, file upload, or secret handling

Review should verify:

- The change matches the documented requirement or task.
- The implementation stays inside the expected ownership boundary.
- Tests cover meaningful behavior and high-risk error paths.
- Documentation is updated when behavior changes.
- No secrets or generated artifacts are committed.
- Security-sensitive changes include authorization, validation, rate-limit, and logging review.

## Backend Standards

Backend code lives under `server/`.

Target structure:

```text
server/
├── config/
└── apps/
    ├── users/
    ├── products/
    ├── cart/
    ├── orders/
    ├── payments/
    └── reviews/
```

Rules:

- Keep domain code under `apps/`.
- Keep `config/` limited to settings, URLs, ASGI, and WSGI.
- Split settings into `base.py`, `development.py`, `production.py`, and `testing.py`.
- Put business workflows in `services.py`.
- Put query composition and read helpers in `selectors.py`.
- Keep views thin: request parsing, permission checks, serializer usage, service calls, and response formatting.
- Commit migrations with related model changes.
- Use PostgreSQL-compatible model fields, indexes, and constraints for release work.
- Load secrets and environment-specific values from environment variables.
- Run Django deployment checks against production settings before release.

## Backend Testing Standard

Backend tests should cover:

- Services and selectors
- API success paths
- API validation failures
- Permission failures
- Authentication and account-state edge cases
- Stock, checkout, payment, and webhook state transitions

Preferred local commands:

```bash
cd server
uv run python manage.py check
uv run pytest
```

## Frontend Standards

Frontend code lives under `client/`.

Target structure:

```text
client/src/app/
├── core/
├── shared/
├── layout/
└── features/
```

Rules:

- Use standalone Angular components.
- Keep feature-owned screens, state, and feature services under `src/app/features/<feature>/`.
- Keep API clients, auth state, guards, interceptors, and shared models under `src/app/core/`.
- Keep reusable presentational components, pipes, and directives under `src/app/shared/`.
- Use lazy-loaded feature routes as the application grows.
- Keep guest-cart state local to the frontend until guest checkout submission.
- Use strict TypeScript and avoid `any`; use `unknown` when the type is genuinely uncertain.
- Prefer reactive forms for forms.
- Use accessible controls, labels, focus states, and color contrast.
- Use hyphenated Angular file names and keep component TypeScript, template, style, and spec file names aligned.

## Frontend Testing Standard

Frontend tests should cover:

- Feature services
- Guards and interceptors
- Critical state transformations
- Form validation
- User-visible edge cases in auth, catalog, cart, checkout, payments, admin, and reviews

Preferred local commands:

```bash
cd client
npm run build
npm test
```

## API Standards

- Public API paths use `/api/v1`.
- Admin API paths use `/api/v1/admin/`.
- API behavior changes must update `docs/SRS.md`.
- List endpoints should use bounded pagination.
- List responses should avoid detail-only fields.
- Endpoints that accept user-owned object identifiers must enforce object-level authorization.
- Admin and privileged operations must enforce function-level authorization.
- Endpoints that can consume significant CPU, memory, storage, email/SMS provider calls, or payment provider calls must have resource limits.
- Product images should be returned by URL, not embedded in JSON.
- Payment amounts must be calculated on the server.
- Online payment state changes must be driven by verified provider responses or webhooks.

## Security Standards

- Never commit secrets or local `.env` files.
- Enable GitHub secret scanning, push protection, Dependabot alerts, and code scanning when available.
- Passwords must use Django's configured password hashing.
- JWT access tokens should be short-lived relative to refresh tokens.
- CORS origins must be environment-specific.
- Admin endpoints must explicitly require admin access.
- Rate limits should protect auth, payment-sensitive, and review-submission endpoints.
- Uploaded product images must be validated before storage.
- Raw card data must never be stored.

## Documentation Standards

- Keep the README focused on onboarding, setup, and project overview.
- Keep the SRS as the source of truth for API contracts, architecture, models, and acceptance criteria.
- Keep requirements checklists traceable to features and tests.
- Update task distribution when ownership or dependencies change.
- Prefer concrete examples and commands over vague instructions.

## Repository Setup After GitHub Creation

Configure these repository settings manually after creating the GitHub repository:

- Set the repository name and description.
- Add a license if the project will be public or reused outside the team.
- Create `develop` from `main`.
- Protect `main` and `develop`.
- Require pull request review before merge.
- Require status checks before merge after CI is added.
- Enable stale approval dismissal for protected branches.
- Enable secret scanning and push protection where available.
- Enable Dependabot alerts and Dependabot security updates.
- Add CODEOWNERS after the team has valid GitHub usernames or organization teams with write access.
