# Security Policy

## Supported Branches

During active development, security fixes should target `develop` first and then be released through the normal merge path to `main`.

After the first release candidate, `main` represents release-ready code and `develop` represents active integration work.

No production release is currently supported because the project is still in the initial scaffold phase.

## Reporting a Vulnerability

Do not open a public issue for sensitive vulnerabilities.

Report security concerns privately to the project maintainers or team lead with:

- A short summary of the issue
- Affected area, endpoint, or workflow
- Reproduction steps
- Potential impact
- Suggested mitigation, if known

## Security Expectations

- Never commit secrets, credentials, API keys, private certificates, database dumps, or local `.env` files.
- Load secrets through environment variables or approved secret management.
- Enable GitHub secret scanning, push protection, Dependabot alerts, and code scanning when the repository is created on GitHub.
- Do not store raw card numbers, CVV values, or full payment provider payloads.
- Validate all API input server-side before database writes.
- Enforce object-level and function-level authorization for APIs that access user-owned or admin-only resources.
- Rate-limit authentication, payment-sensitive, and review-submission endpoints.
- Apply bounded pagination and resource limits to endpoints that can return or process many records.
- Verify payment provider webhook signatures before changing order or payment state.
- Keep admin APIs under `/api/v1/admin/` and protect them with explicit admin permissions.
- Validate uploaded product images for allowed file type and size.
- Run `uv run python manage.py check --deploy` against production settings before deployment.

## Dependency Updates

- Backend dependencies are managed with `uv`.
- Frontend dependencies are managed with npm and `package-lock.json`.
- Dependency changes must be committed with the matching lockfile update.
- Security updates should include a short note describing the affected package and reason for the update.
- Dependabot is configured for `uv`, npm, and GitHub Actions manifests.
