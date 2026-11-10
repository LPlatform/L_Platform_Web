# Testing

Three layers protect the admin portal: schema/helper unit tests, service integration tests against
the mock database, and Playwright end-to-end tests over the real UI.

## Commands

```bash
pnpm test           # Vitest unit + integration
pnpm test:watch     # Vitest watch mode
pnpm test:coverage  # v8 coverage (src/lib and src/types)
pnpm e2e            # Playwright, Chromium, port 3100
pnpm exec playwright install chromium   # first E2E run only
```

Run checks in order before a PR: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`,
`pnpm build`, `pnpm e2e`.

## Unit and integration tests

Configuration: `vitest.config.ts` (jsdom, `src/**/*.test.{ts,tsx}`, v8 coverage) and
`vitest.setup.ts` (jest-dom matchers, cleanup after each test, localStorage cleared, minimal
`matchMedia`/`ResizeObserver`/pointer-capture stubs).

| File                                             | Coverage                                                                                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/csv.test.ts`                            | CSV parsing, quoting, header handling and export escaping (8 tests)                                                                                                                     |
| `src/lib/validation/schemas.test.ts`             | Zod rules for organizations, users, courses, classes, allocations, invitations and settings (17 tests)                                                                                  |
| `src/lib/mock/services/services.test.ts`         | Organization onboarding, duplicate rules, invitations, users/administrators, classes/sections and rosters, course lifecycle, allocations, audit filtering, reports, settings (19 tests) |
| `src/components/admin/status-badge.test.tsx`     | Known status labels and unknown-status fallback (2 tests)                                                                                                                               |
| `src/components/admin/table-pagination.test.tsx` | Range text, page count, navigation callbacks, boundary states and custom item labels (4 tests)                                                                                          |

Service tests are deterministic:

```ts
beforeEach(() => {
  configureMockApi({ latencyMs: 0 });
  resetDb();
});
```

They call `services` directly, so they verify rules independently of React. Use `resetDb()` for
isolation and prefer seed lookups by name only in tests, then assert with IDs.

Note: assignment services deduplicate input IDs. To assert a skipped duplicate, assign once and
repeat the call; passing the same ID twice in one request reports `assigned: 1, skipped: 0`.

## End-to-end tests

`e2e/admin-portal.spec.ts` runs against a real Next.js server:

1. **Unauthenticated redirect** — `/admin/dashboard` redirects to `/login?next=%2Fadmin%2Fdashboard`.
2. **Invalid credentials** — the sign-in form rejects a bad password with an inline error.
3. **Golden path** — signs in with the demo platform administrator, then:
   - onboards an organization and captures its ID from the URL;
   - validates a required class field, creates a class and a section;
   - creates a student and assigns them to the section roster;
   - creates an active course and allocates it to the organization;
   - creates, resends and revokes a mock invitation;
   - opens a report, filters the audit log and uses global search;
   - saves settings and resets demo data.

The test generates unique suffixes from `Date.now()` and computes the academic year from the
current month, so it does not depend on fixture dates.

Playwright configuration: Chromium only, port `3100`, traces on first retry, screenshots on
failure, two CI workers and two retries. The dev server command can be overridden:

```bash
PLAYWRIGHT_WEB_SERVER_COMMAND="pnpm start" pnpm e2e   # after pnpm build
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm e2e    # reuse an existing server
```

## CI

`.github/workflows/ci.yml` keeps the existing jobs and conventions:

| Job               | Checks                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------- |
| `bootstrap-smoke` | Repository policy files and sha-pinned Actions guard                                   |
| `readiness`       | Detects whether `package.json` exists                                                  |
| `web-product-ci`  | install, format, lint, typecheck, unit tests, build                                    |
| `web-e2e`         | install, Playwright Chromium with dependencies, build, `pnpm e2e` against `pnpm start` |

CI pins pnpm `10.20.0` to match `packageManager` and uses the Node version from `.nvmrc`. All
Actions are referenced by full commit SHA.

## Known gaps

- Component tests cover two shared building blocks, not full pages, forms or query hooks.
- There is no visual regression suite and no cross-browser matrix; only Chromium runs.
- The E2E suite has one broad golden path rather than one spec per feature.
- Failure simulation, pagination edge cases and CSV import are covered by service tests or not at
  all, rather than by UI tests.
- No test asserts backend behavior, because no backend is part of this repository.

A missing check is a readiness gap, not a pass. When a check cannot run locally, say so explicitly.
