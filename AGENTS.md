# Engineering instructions

## Architecture

L_Platform Web is the frontend for a private education platform. It currently ships the admin
portal; the teacher portal is planned. Stack: Next.js App Router, React, strict TypeScript,
Tailwind CSS, shadcn/ui-style Radix components, Zod, React Hook Form, TanStack Query/Table,
Recharts, Lucide and pnpm.

All data access goes through the service contracts in `src/lib/api/contracts.ts`. The active
implementation is the mock adapter in `src/lib/mock/services`, persisted in localStorage under
`lplatform.mock.database`. UI code and hooks must import `services` from `src/lib/api`, never a mock
module directly, so the adapter can be replaced by generated API clients without touching screens.

The backend owns API contracts, authorization and organization isolation. Never add Next.js route
handlers, server actions or other backend services to this repository for product behavior.

## Security and product boundaries

- The `/admin` middleware redirect is a **frontend route boundary only**. Never describe it as
  authentication or authorization, and never rely on it for data protection.
- Demo credentials are mock constants. Never persist plaintext passwords or create real
  credentials, sessions or tokens.
- Invitations, notifications and report exports are mock operations. Never send email or call
  external services.
- Use `organizationId`, `classId`, `sectionId`, `courseId`, `allocationId` and `userId` for
  relationships and filtering. Never use names as identifiers.
- Do not add subscription payments or billing without an approved milestone.

## Development rules

- Use strict TypeScript, small focused modules, accessible UI and validated input at boundaries.
  Share a Zod schema between forms and mock services when both validate the same data.
- Keep domain types in `src/types` and mock-only types out of UI contracts.
- Every domain mutation that changes state should record an audit entry through `recordAudit`.
- Use short lived `feature/*`, `fix/*`, `refactor/*`, `chore/*`, `docs/*` or `security/*` branches.
  PRs target `main`; use Conventional Commits and squash merges. Never force push, rewrite history,
  bypass checks, or commit directly to `main`.
- Preserve existing GitHub Actions conventions: pinned Actions SHAs, least privilege, frozen
  lockfiles and no secrets on fork PRs.
- Keep the pnpm version aligned between `packageManager` and CI. Do not upgrade major framework
  versions without a clear, documented reason.
- Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm e2e`
  where configured. A missing check is a readiness gap, not a pass.
- Releases use independent `web-vX.Y.Z` tags after successful checks. Follow
  [release process](docs/release-process.md).

## Where things live

- Feature behavior and scope rules: `docs/admin-portal/*.md`.
- Mock data contract, seed fixtures and failure simulation: `docs/admin-portal/mock-services.md`.
- Test layers and CI expectations: `docs/admin-portal/testing.md`.
- Session boundary: `middleware.ts`, `src/lib/mock/session.ts`, `src/lib/api/auth.service.ts`.

Inspect existing files and diffs first, preserve user changes, make focused edits, never add
secrets, never claim an unrun check passed, and report blockers and remaining work.
