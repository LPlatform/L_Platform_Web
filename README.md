# L_Platform Web

Frontend for the L_Platform education platform. This repository currently contains the **admin portal** built against an in-browser mock data layer. It is a demonstration product: no backend service, database, real authentication, email delivery or payment integration is included.

> **Security note:** the `/admin` route guard is a frontend convenience boundary backed by a localStorage session and a cookie. It is **not** authentication or authorization. In production, the private backend must enforce every permission and organization-scope rule. See [SECURITY.md](SECURITY.md).

## Stack

- Next.js 15 App Router, React 19, strict TypeScript
- Tailwind CSS v4 with OKLCH design tokens and `next-themes` dark mode
- shadcn/ui-style components on Radix primitives, Lucide icons, Sonner toasts
- TanStack Query v5 for server-state hooks, TanStack Table v8 for data grids
- Zod + React Hook Form for validation, Recharts for dashboard charts
- Vitest + Testing Library for unit/integration tests, Playwright for end-to-end tests
- pnpm 10.20.0 (pinned through `packageManager`)

## Quick start

Requirements: Node.js per [.nvmrc](.nvmrc) (`24.22.1`) and Corepack.

```bash
corepack enable
corepack prepare pnpm@10.20.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:3000>. The app redirects to `/login`.

### Demo accounts

| Account                    | Email                        | Password       | Scope                   |
| -------------------------- | ---------------------------- | -------------- | ----------------------- |
| Platform administrator     | `admin@lplatform.dev`        | `Admin@123`    | Full admin portal       |
| Organization administrator | `priya.sharma@riverside.edu` | `OrgAdmin@123` | Riverside Public School |

These credentials are constants in the mock adapter and are never written to the mock database. They must be replaced by real authentication before any production use.

## Scripts

| Command                             | Purpose                                |
| ----------------------------------- | -------------------------------------- |
| `pnpm dev`                          | Start the development server           |
| `pnpm build` / `pnpm start`         | Production build and server            |
| `pnpm lint`                         | ESLint                                 |
| `pnpm typecheck`                    | `tsc --noEmit`                         |
| `pnpm test`                         | Vitest unit and integration suite      |
| `pnpm test:coverage`                | Vitest with coverage                   |
| `pnpm e2e`                          | Playwright suite (Chromium, port 3100) |
| `pnpm format` / `pnpm format:check` | Prettier write / check                 |

The first E2E run needs a browser: `pnpm exec playwright install chromium`.

## Repository structure

```text
src/
  app/                 App Router routes (login + /admin/*)
  components/admin/    Portal shell, forms, tables, dialogs, charts
  components/ui/       Design-system primitives
  lib/api/             Service contracts, errors, pagination, mock latency
  lib/mock/            Seed data, localStorage database, mock adapters, session
  lib/hooks/           TanStack Query hooks
  lib/validation/      Zod schemas shared by forms and mock services
  lib/labels.ts        Human-readable status/role/audit labels
  types/               Domain types
e2e/                   Playwright specs
docs/admin-portal/     Admin portal feature and architecture docs
```

## Documentation

- [Admin portal overview](docs/admin-portal/overview.md)
- [Organization management](docs/admin-portal/organization-management.md)
- [User and administrator management](docs/admin-portal/user-management.md)
- [Class and section management](docs/admin-portal/class-management.md)
- [Course management](docs/admin-portal/course-management.md)
- [Course allocation](docs/admin-portal/course-allocation.md)
- [Mock services](docs/admin-portal/mock-services.md)
- [Testing](docs/admin-portal/testing.md)
- [Milestone 3 backend readiness audit](docs/integration/backend-readiness-audit.md)
- [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md) · [Repository audit](docs/repository-audit.md)

## Backend integration status

As of 2026-11-10, Web Milestone 1 PR #7 is merged, but Backend foundation PR #1 remains open
and neither backend `main` nor the proposed foundation contains Milestone 2 application code,
migrations, authentication, Admin APIs or an OpenAPI document. Milestone 3 integration is blocked;
merging the backend foundation alone will not resolve the missing implementation. See the
[readiness audit](docs/integration/backend-readiness-audit.md) for pinned evidence and conditions
to resume. The Admin Portal runtime remains mock-only and is not production-ready.

## Scope boundaries

- The backend and application repositories are out of scope for this milestone.
- Invitations are mock operations; no email is sent.
- Settings are stored in browser storage only.
- The teacher portal is planned, not implemented. See [ROADMAP.md](ROADMAP.md).

## Contributing

Use short-lived branches (`feature/*`, `fix/*`, `refactor/*`, `chore/*`, `docs/*`, `security/*`), Conventional Commits and a pull request to `main`. Run formatting, lint, typecheck, tests, build and end-to-end tests before opening a PR. CI is authoritative. Report security issues privately as described in [SECURITY.md](SECURITY.md).
