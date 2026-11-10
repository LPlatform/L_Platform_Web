# Mock services

The admin portal runs against a deterministic in-browser data layer. It exists so every workflow
is usable without a backend while keeping a clean seam for future generated API clients.

## Architecture

```text
UI → hooks (TanStack Query) → services (src/lib/api/index.ts)
     → contracts (src/lib/api/contracts.ts)
         → mock adapters (src/lib/mock/services/*)
             → MockDatabase (src/lib/mock/db.ts) → localStorage
```

- `src/lib/api/index.ts` re-exports `services`, `authService`, `DEMO_ACCOUNTS`, error helpers and
  `configureMockApi`. UI and hooks must not import `src/lib/mock/*` service modules directly.
- `PlatformServices` exposes `organizations`, `users`, `administrators`, `classes`, `sections`,
  `courses`, `allocations`, `invitations`, `reports`, `audit`, `dashboard`, `settings` and
  `lookups` (eligible students and teachers).
- Zod schemas in `src/lib/validation` are applied inside the adapters, so service calls are
  validated even when the UI is bypassed.

## Persistence

- Key: `lplatform.mock.database`
- Version: `2`. A stored database with a different version is discarded and reseeded.
- `getDb()` loads localStorage or seeds and caches in memory; `mutateDb()` runs a mutator and
  persists; `resetDb()` reseeds and persists.
- If localStorage is unavailable (private browsing, quota), the in-memory store still works for the
  current page session.
- `createId()` uses `crypto.randomUUID()` when available. Public IDs use temporal sequences
  (`ORG-2026-0006`, `USR-2026-00042`, `CLS-2026-0031`, `SEC-2026-0061`, `CRS-2026-0009`,
  `ALL-2026-0014`, `INV-2026-0013`).

## Seed dataset

`src/lib/mock/seed.ts` generates stable fixtures relative to the current date:

| Entity        | Count | Notes                                                                                                             |
| ------------- | ----- | ----------------------------------------------------------------------------------------------------------------- |
| Organizations | 5     | Riverside Public School, Greenwood International, BrightPath Learning, Nova Institute (inactive), Horizon Academy |
| Users         | 147   | 118 students, 22 teachers, organization administrators and one platform administrator (Aarav Mehta)               |
| Classes       | 30    | Six per organization                                                                                              |
| Sections      | 60    | Two per class (A and B)                                                                                           |
| Courses       | 8     | Across Python, Java and C++, with mixed statuses                                                                  |
| Allocations   | 13    | Organization, class and section scopes                                                                            |
| Invitations   | 12    | Pending, accepted, expired and revoked states                                                                     |
| Audit logs    | 24    | Seeded activity across organizations                                                                              |

Riverside Public School is the largest cohort with 30 students, 5 teachers and 6 classes. Accepted
invitations exist only for Greenwood and BrightPath.

## Latency and failure simulation

`src/lib/api/delay.ts` wraps every adapter call in `mockRequest(operation, resolver)`:

- 220 ms base latency plus up to 120 ms jitter (0 when `latencyMs` is 0).
- Optional failure rate (0–1) persisted under `lplatform.mock.failureRate`; failures throw
  `MOCK_UNAVAILABLE` (HTTP 503 semantics).
- Tests call `configureMockApi({ latencyMs: 0 })` for determinism.
- The Settings page exposes the same reset flow used by tests: `services.settings.resetDemoData()`.

## Error model

`ApiError` carries a `code`, message, optional HTTP-like `status` and field errors. Codes:
`NOT_FOUND`, `VALIDATION_FAILED`, `DUPLICATE`, `CONFLICT`, `ORGANIZATION_INACTIVE`,
`CROSS_ORGANIZATION`, `COURSE_UNAVAILABLE`, `DUPLICATE_ALLOCATION`, `MOCK_UNAVAILABLE`,
`UNAUTHORIZED`. Forms map `fieldErrors` back to inputs; toasts use `getErrorMessage`.

## Auditing

`recordAudit` writes an entry with actor, action, entity type/ID/label, organization, status,
metadata, correlation ID and timestamp. Every domain mutation (organizations, users, classes,
sections, courses, allocations, invitations) calls it; settings updates are the deliberate
exception. The audit service filters
by organization, action, entity type and free-text search over actor, action, entity, organization
and correlation ID. The `ALL` sentinel disables a filter.

## Invitations

- Creation requires an active organization; the recipient is matched case-insensitively.
- Pending invitations for the same recipient in the same organization are rejected; so are
  recipients who already belong to the organization.
- New invitations expire after seven days. `effectiveInvitationStatus` computes `EXPIRED` for stale
  pending rows.
- Resend is blocked for accepted or revoked invitations and refreshes expiry/last-sent time.
- Revoke is blocked for accepted and already-revoked invitations.
- No email or external call occurs. UI copy states this explicitly.

## Session boundary

`src/lib/mock/session.ts` stores the mock session in localStorage
(`lplatform.mock.session`) and sets the cookie `lplatform.mock.session=1`. `middleware.ts` uses
the cookie only to redirect `/admin` and `/login`. This is **not authentication**; it must never be
presented as security. Demo credentials live as constants in `src/lib/api/auth.service.ts` and are
not persisted to the database.

## Replacing the mock layer

Implement `PlatformServices` and the auth contract against generated clients, then change
`src/lib/api/index.ts` to export them. Hooks, pages and components should not need edits. Delete
the cookie boundary when real session handling lands; backend middleware must enforce
authorization and organization isolation.
