# L_Platform Web

Private repository for the L_Platform admin and teacher portals. This repository is an engineering foundation; product screens and backend behavior are not included yet.

## Stack and local development

The planned stack is Next.js App Router, React, strict TypeScript and pnpm. The repository is being initialized; see [repository audit](docs/repository-audit.md) for current readiness and [GitHub Actions](docs/github-actions.md) for checks and known prerequisites.

Use short lived branches (`feature/*`, `fix/*`, `refactor/*`, `chore/*`, `docs/*`, `security/*`) and open a PR to `main`. Use Conventional Commits and squash merge. Do not commit secrets or `.env*` files.

## Quality and security

Run `pnpm install --frozen-lockfile` and the checks provided by the project before opening a PR. CI is authoritative. Report security issues privately as described in [SECURITY.md](SECURITY.md).
