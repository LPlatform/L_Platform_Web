# Engineering instructions

## Architecture
Private admin and teacher portals. Planned stack: Next.js App Router, React, strict TypeScript, Tailwind, shadcn/ui, Zod, React Hook Form, TanStack Query/Table, Recharts, Lucide, pnpm. No application features are part of the repository foundation.

## Development rules
- Keep this repository independent; the backend owns API contracts and this repository consumes pinned, generated OpenAPI clients.
- Use strict TypeScript, small focused modules, accessible UI and validated external input. Never embed credentials.
- Use short lived `feature/*`, `fix/*`, `refactor/*`, `chore/*`, `docs/*` or `security/*` branches. PRs target `main`; use Conventional Commits and squash merges. Never force push, rewrite history, bypass checks, or commit directly to `main`.
- Run formatting, lint, type checks, unit/integration tests and production build where configured. A missing check is a readiness gap, not a pass.
- CI should use least privilege, pinned Actions, frozen lockfiles and no secrets on fork PRs. Deploy only from protected environments after a target is configured.
- Releases use independent `web-vX.Y.Z` tags after successful checks. Follow [release process](docs/release-process.md).
- Codex must inspect existing files and diffs first, preserve user changes, make focused edits, never add secrets, never claim an unrun check passed, and report blockers and remaining work.
