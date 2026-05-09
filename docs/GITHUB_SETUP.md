# GitHub Repository Setup Checklist

Use this checklist after the remote GitHub repository is created. These settings are not fully enforceable from files in this repository, so a repository admin must apply them in GitHub.

## Required Branches

- Create `develop` from `main`.
- Keep `main` as the release branch.
- Keep `develop` as the integration branch.
- Require feature, fix, test, docs, and chore branches to branch from `develop`.

## Branch Protection

Protect both `main` and `develop`:

- Require pull requests before merging.
- Require at least one approving review.
- Dismiss stale approvals when new commits are pushed.
- Require conversation resolution before merge.
- Require status checks before merge after CI is added.
- Block force pushes.
- Block branch deletion.
- Restrict direct pushes to repository admins only, or disable direct pushes entirely if the team workflow allows it.

Recommended future status checks:

- Backend tests
- Backend lint or type checks
- Frontend tests
- Frontend build

## Repository Security

Enable these repository security settings where available:

- Secret scanning
- Push protection
- Dependabot alerts
- Dependabot security updates
- Code scanning after a workflow is added

## Pull Request Defaults

- Use squash merge for feature work.
- Require PR descriptions to include task or requirement IDs when available.
- Require migration notes for database changes.
- Require screenshots or recordings for visible UI changes.
- Require security notes for auth, admin, payment, upload, or user-data changes.

## Labels

Create or verify these labels:

- `backend`
- `frontend`
- `api-contract`
- `auth`
- `products`
- `cart`
- `checkout-orders`
- `payments`
- `reviews`
- `admin`
- `documentation`
- `tooling-ci`
- `qa`
- `bug`
- `enhancement`
- `task`
- `security`

## CODEOWNERS

Do not add `CODEOWNERS` until real GitHub usernames or teams have write access. Once available, add owners for:

- `server/`
- `client/`
- `docs/`
- `.github/`
- shared API contract files
