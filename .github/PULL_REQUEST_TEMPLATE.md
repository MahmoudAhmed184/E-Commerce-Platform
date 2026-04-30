## Summary

<!-- Explain what changed and why. Keep this focused on the reviewer-facing behavior. -->

## Type of Change

- [ ] Feature
- [ ] Bug fix
- [ ] Test
- [ ] Refactor
- [ ] Documentation
- [ ] Chore / tooling

## Related Work

<!-- Link issue, task ID, requirement ID, or SRS section. -->

- Closes:
- Task:
- Requirement IDs:

## Scope

<!-- List the main files, modules, apps, or feature areas touched. -->

-

## Backend Checklist

- [ ] Not applicable
- [ ] Business logic is in `services.py`
- [ ] Query logic is in `selectors.py`
- [ ] Views remain thin
- [ ] Migrations are included with model changes
- [ ] API contract changes are reflected in `docs/SRS.md`
- [ ] Permission, validation, and error paths are handled

## Frontend Checklist

- [ ] Not applicable
- [ ] Feature code is under `src/app/features/`
- [ ] Shared API services, guards, interceptors, or models are under `src/app/core/`
- [ ] Shared UI-only pieces are under `src/app/shared/`
- [ ] UI changes include accessible labels, focus states, and keyboard-friendly behavior
- [ ] Screenshots or recordings are attached for visible UI changes

## Security and Data Checklist

- [ ] No secrets, credentials, local `.env` files, generated caches, or dependency folders are committed
- [ ] Auth, admin, payment, upload, and user-data changes were reviewed for security impact
- [ ] Object-level and function-level authorization were checked for new or changed API access
- [ ] New or changed APIs have bounded pagination, rate limits, or resource limits where applicable
- [ ] Payment amounts are calculated server-side
- [ ] Raw card data is not stored or logged
- [ ] Uploaded files are validated where applicable

## Breaking Changes / Migration Notes

<!-- Document database migrations, environment variables, API contract changes, dependency changes, or deployment steps. Write "None" if not applicable. -->

## Testing

<!-- List exact commands run and summarize results. If skipped, explain why. -->

```bash
# Backend

# Frontend
```

## Screenshots / Recordings

<!-- Required for visible UI changes. Remove this section if not applicable. -->

## Reviewer Notes

<!-- Call out risky areas, follow-up work, migration notes, or review focus. -->
