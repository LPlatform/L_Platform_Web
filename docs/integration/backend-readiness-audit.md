# Milestone 3 backend readiness audit

Audit date: 2026-11-10 (UTC). Decision: **BLOCKED — do not begin integration**.

Milestone 1 is merged, but Milestone 2 is not implemented in the inspected backend refs.
This is an audit-only change. No API client, generated types, authentication changes or mock
adapter replacement has been implemented. The existing Admin Portal remains a mock demonstration,
including in a production build; it is not ready for production data or real credentials.

## Prerequisite evidence and inspected revisions

| Check                   | Evidence                                                                                                                                                                         | Result                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Web Milestone 1         | [Web PR #7](https://github.com/LPlatform/L_Platform_Web/pull/7) merged on 2026-11-10 at 13:00:11 UTC; Web `main` is `ee5538e6773bb37725529ab4c9e933c2458565f1`                   | Passed                  |
| Backend foundation      | [Backend PR #1](https://github.com/LPlatform/L_Platform_Backend/pull/1) is OPEN, with no merge commit or merge timestamp                                                         | Blocked                 |
| Backend `main`          | `8727814c2182ddd4d49bd834e1513304e483f703`, message `chore: initialize default branch`; no parents or files; tree `4b825dc642cb6eb9a060e54bf8d69288fbee4904` is empty            | No application          |
| Backend Milestone 2 PRs | Authenticated GitHub PR inventory returned only foundation PR #1, unmerged; no merged PRs or Milestone 2 implementation PRs                                                      | Not delivered           |
| Proposed foundation     | `chore/repository-foundation` at `d6761bdfc0badc929ed80b7629e4f0b026e3a56b`; 29 tracked files comprising governance, documentation, workflows and a repository-policy smoke test | Not a product backend   |
| Local backend reference | Existing checkout matches the proposed foundation revision; its tracked-file inventory was inspected read-only                                                                   | No runnable application |

The complete remote branch inventory contained only `main` and `chore/repository-foundation`.
These findings concern the inspected repository state, not unpublished work elsewhere. Merging
Backend PR #1 alone will **not** deliver Milestone 2.

The pinned foundation [README](https://github.com/LPlatform/L_Platform_Backend/blob/d6761bdfc0badc929ed80b7629e4f0b026e3a56b/README.md)
explicitly states that no business modules are implemented. Its
[repository audit](https://github.com/LPlatform/L_Platform_Backend/blob/d6761bdfc0badc929ed80b7629e4f0b026e3a56b/docs/repository-audit.md)
lists application code, ORM, migrations, Dockerfile, product tests and OpenAPI as unconfigured.

## Backend capabilities and startup

| Capability              | Actual finding                                                                                                                     | Integration consequence                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Application runtime     | No package manifest, dependency lockfile, application source, server entry point or startup script in either inspected backend ref | Cannot install or start an API server                  |
| Database and migrations | No ORM/schema, migrations, migration runner or development seed data                                                               | Cannot establish persistence or isolated test data     |
| Authentication          | No login, session, refresh, rotation, expiry, revocation or logout implementation                                                  | No verified browser authentication mechanism           |
| Authorization           | No server-side role/resource permission implementation or tests                                                                    | No authoritative access enforcement to integrate       |
| Organization isolation  | No tenant-scoped persistence, request handling or cross-organization tests                                                         | Organization IDs in Web cannot establish authorization |
| Admin APIs              | No controllers, routes or business services                                                                                        | Zero implemented HTTP operations verified              |
| API conventions         | No request/response DTOs, status enums, pagination/filtering, error format or correlation-ID contract                              | Web types cannot be assumed to match a backend         |
| Browser transport       | No implemented CORS, credential/cookie, CSRF or token transport behavior                                                           | Browser security configuration cannot be validated     |
| OpenAPI                 | No specification, generator or published contract identified in the inspected refs                                                 | No contract validation or type generation possible     |

Backend startup and HTTP smoke tests were **not run**: there is no backend program or supported
startup command in the inspected source. This is an implementation blocker, not a claim that the
local machine cannot run Node.js or a database. No port, API URL or health endpoint was guessed,
no server was substituted, and no production database or external deployment was contacted.

The proposed backend
[OpenAPI workflow](https://github.com/LPlatform/L_Platform_Backend/blob/d6761bdfc0badc929ed80b7629e4f0b026e3a56b/.github/workflows/openapi-contract.yml)
checks for `openapi/openapi.yaml` and skips validation/packaging when absent. That path is a
planned producer location, **not an existing contract**. The proposed
[database workflow](https://github.com/LPlatform/L_Platform_Backend/blob/d6761bdfc0badc929ed80b7629e4f0b026e3a56b/.github/workflows/database-tests.yml)
also gates migration tests on a package manifest that does not exist. Workflow scaffolding and
readiness checks are not evidence of working APIs, migrations or authentication.

## Contract version and compatibility

- OpenAPI version: **unavailable**; no document exists to validate.
- Backend contract/release version: **unavailable**. The commit hashes above pin audit evidence,
  not a usable API contract.
- Generated TypeScript DTOs, repeatable generation command and stale-type CI check: **blocked**.
- The backend's pinned
  [contract publishing document](https://github.com/LPlatform/L_Platform_Backend/blob/d6761bdfc0badc929ed80b7629e4f0b026e3a56b/docs/integration/api-contracts.md)
  confirms that no API application, generator, registry or consumer automation exists yet.
- Web [service interfaces](../../src/lib/api/contracts.ts) describe the current UI-facing mock
  adapter contract; they are not backend DTOs or an HTTP API specification.
- Existing Web [contract guidance](api-contracts.md) remains applicable. No competing OpenAPI
  document, guessed DTOs or pretend generation/check commands have been added.

## Endpoint inventory and module mapping

Verified implemented endpoints: **0**. Every endpoint mapping below is unavailable; service names
identify existing Web consumers only and must not be converted into guessed HTTP paths.

| Admin Portal module             | Current Web consumer                            | Verified backend endpoint | Integration status / missing behavior                                                                  |
| ------------------------------- | ----------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| Authentication                  | `authService`                                   | None                      | Blocked: login, logout, session restoration and supported refresh/revocation behavior                  |
| Dashboard                       | `services.dashboard`                            | None                      | Blocked: authorized summaries, charts and recent activity, or suitable paginated source APIs           |
| Organizations and details       | `services.organizations`                        | None                      | Blocked: list/search/options, detail, create, update and status changes                                |
| Users and administrators        | `services.users`, `services.administrators`     | None                      | Blocked: scoped lists/details, create/update/status, permitted role assignments and permission catalog |
| CSV preview and confirmation    | `services.users.importPreview`, `importConfirm` | None                      | Blocked: server validation, duplicate handling and confirmed import outcomes                           |
| Invitations                     | `services.invitations`                          | None                      | Blocked: list, create, resend, revoke, expiry/status and truthful delivery outcomes                    |
| Classes and sections            | `services.classes`, `services.sections`         | None                      | Blocked: scoped lists/details/options, create/update/status and roster reads                           |
| Student and teacher memberships | `services.sections`, `services.lookups`         | None                      | Blocked: authorized student/teacher lookups, assignment/removal and bulk import validation             |
| Courses                         | `services.courses`                              | None                      | Blocked: list/detail/options, metadata updates and lifecycle behavior                                  |
| Course allocations              | `services.allocations`                          | None                      | Blocked: list/detail/create/update/revoke, scope validation and effective access                       |
| Reports                         | `services.reports`                              | None                      | Blocked: real report definitions/data and supported filters; no fabricated metrics                     |
| Audit logs                      | `services.audit`                                | None                      | Blocked: immutable server audit records with authorized filters/pagination                             |
| Global search                   | `searchAll` composes six list services          | None                      | Blocked: authorized search/filter support on source APIs or a verified search contract                 |
| Settings                        | `services.settings`                             | None                      | Blocked: server-owned settings and permissions; theme remains a local display preference               |

Fully integrated modules: **none**. Partially integrated modules: **none**. Existing rendered
pages and mock workflows do not count as backend integration.

## Existing Web implementation to preserve

The existing architecture remains pages/shared Admin components → TanStack Query hooks →
[API export boundary](../../src/lib/api/index.ts) → typed service interfaces → mock services →
[browser database](../../src/lib/mock/db.ts). Shared forms, tables, dialogs, loading/empty/error
states and validation can be retained when real contracts become available.

Relevant consumers and coupling found during discovery:

- The API export boundary unconditionally exports the mock adapter, mock session, demo accounts,
  database reset and failure simulation. There is no production real-API selection today.
- [Authentication](../../src/lib/api/auth.service.ts) imports the mock database/session directly.
  The [session provider](../../src/components/admin/session-provider.tsx), login UI and Admin
  shell depend on these mock exports. Replacing data services alone will not replace sign-in.
- [Query hooks](../../src/lib/hooks/use-platform-data.ts) include supplied filters in list keys,
  but dashboard/settings/options keys are global and detail keys use resource IDs only.
  Mutations broadly invalidate all queries; query functions do not forward request cancellation.
- The session provider redirects after logout without clearing the QueryClient. Real integration
  must isolate caches by authenticated context, cancel obsolete requests and clear protected data
  on logout/context changes; backend permissions remain authoritative.
- [Global search](../../src/app/admin/search/page.tsx) runs six list calls for organizations,
  users, classes, sections, courses and allocations. It is not backed by a search endpoint.
- Mock domain data and platform settings persist in `lplatform.mock.database`; the mock session
  and failure simulation also use browser storage. These are not legitimate production server
  state. The theme controlled through `next-themes` is a legitimate local UI preference.
- [Zod validation](../../src/lib/validation/schemas.ts) and existing domain types reflect mock
  rules. Backend validation, pagination, status values and error shapes still need comparison
  against a real contract before adapters can be implemented.

No production imports have been changed. Mock services have not been removed, mixed with real
records, relabeled as real APIs or used as substitute backend evidence.

## Security concerns

1. The [middleware](../../middleware.ts) trusts a JavaScript-set demo cookie for navigation only.
   The mock localStorage session is not authenticated identity; it provides no server security.
2. In-browser organization filters and mutation checks do not prove tenant isolation. Cross-tenant
   and role/resource authorization require backend enforcement and negative integration tests.
3. Real session transport is unknown. Do not assume OIDC, bearer tokens, refresh rotation or
   HttpOnly cookies are available; inspect the implemented backend first. Never persist
   long-lived refresh tokens in localStorage or expose secrets through frontend configuration.
4. Existing mock reports, invitation changes and audit records are demonstrations, not real
   analytics, email delivery or tamper-resistant audit evidence.
5. Existing builds still include demo data and mock authentication. Do not use this audit PR as
   production approval. Removing those paths remains blocked integration work.

## Exact blockers and conditions to resume

1. Merge Backend foundation PR #1 through normal review; do not bypass governance.
2. Deliver and merge Milestone 2 application source, reproducible dependencies, real migrations,
   development seed data and documented local/test startup instructions.
3. Implement and test authentication, authorization and tenant/resource isolation, including
   unauthorized/forbidden requests and cross-organization access rejection.
4. Implement the Admin APIs needed by the existing workflows; explicitly identify any remaining
   unsupported features rather than presenting workflow stubs as complete.
5. Generate, validate and make available a backend-owned OpenAPI document pinned to the actual
   implementation. It must describe authentication, operations, DTOs, enums, pagination/filtering
   and errors; establish private artifact access without publishing sensitive contracts.
6. Start that backend against an isolated development/test database and verify representative
   authenticated requests, mutation persistence and authorization failures where tooling permits.
   Record any environmental limits separately from missing implementation.
7. Re-run this prerequisite audit on current remote refs before implementing the Web client,
   generated-type checks, authentication, tenant cache isolation and real service adapters.

The integration-specific `api-contract.md`, `authentication-flow.md`, `local-development.md` and
`testing.md` guides are deferred until their underlying backend behavior can be verified. Existing
mock development/testing guides are not being represented as real-backend instructions.

## Verification scope

The audit used authenticated GitHub PR/branch/commit/file reads and read-only inspection of the
existing backend checkout. The initial recursive-tree API request returned HTTP 404; a subsequent
commit inspection established that backend `main` has the canonical empty tree and no files.
The empty-tree finding does not rely on interpreting a 404 as proof that implementation is absent.

Web regression results for this audit-only PR will be recorded after running the existing checks.
Those checks exercise mock services and the browser UI, not backend HTTP integration. Real-backend
migrations, contract validation, login/refresh/revocation, API mutations, authorization and tenant
isolation tests are **not runnable**, not passed or silently skipped. No new mocked-network tests
have been added as substitutes.

Reproduce the remote prerequisite checks with authenticated GitHub CLI access:

```bash
gh pr view 7 --repo LPlatform/L_Platform_Web --json state,mergedAt,mergeCommit
gh pr view 1 --repo LPlatform/L_Platform_Backend --json state,mergedAt,headRefOid,files
gh pr list --repo LPlatform/L_Platform_Backend --state all --limit 100
gh api repos/LPlatform/L_Platform_Backend/branches --paginate
gh api repos/LPlatform/L_Platform_Backend/commits/main
```

All changes in this PR are confined to Web documentation. Backend/Application repositories,
application runtime, dependencies, CI, security and governance workflows remain unchanged.
