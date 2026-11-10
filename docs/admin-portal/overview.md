# Admin portal overview

The admin portal is the L_Platform operator surface for onboarding schools, managing people,
building academic structure, publishing courses and allocating them to organizations. It runs
entirely in the browser against a deterministic mock data layer.

## Who it serves

- **Platform administrators** manage every organization, user, course, allocation, report and
  setting.
- **Organization administrators** have a demo account scoped to Riverside Public School. The UI
  presents the same layout; real organization-level enforcement is a backend responsibility.

## Information architecture

| Group        | Routes                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------- |
| Overview     | `/admin/dashboard`                                                                                  |
| Organization | `/admin/organizations`, `/new`, `/[organizationId]`, `/[organizationId]/edit`                       |
| People       | `/admin/users`, `/admin/administrators`, `/admin/teachers`, `/admin/students`, `/admin/invitations` |
| Academics    | `/admin/classes`, `/admin/sections`, `/admin/courses`, `/admin/allocations`                         |
| Insights     | `/admin/reports`, `/admin/reports/[reportId]`, `/admin/audit-logs`, `/admin/search`                 |
| System       | `/admin/settings`                                                                                   |

`/login` is public. `/` redirects to the dashboard or sign-in depending on the mock session.
List pages share a toolbar with search, filters and pagination; detail pages use a header with
contextual actions; all mutations surface Sonner toasts and field-level validation errors.

## Architecture

```text
Route (src/app) → component (src/components/admin)
    → TanStack Query hook (src/lib/hooks/use-platform-data.ts)
        → service contract (src/lib/api/contracts.ts)
            → mock adapter (src/lib/mock/services/*)
                → localStorage database (src/lib/mock/db.ts)
```

- `src/lib/api/index.ts` is the single swap point. UI code imports `services`, `authService` and
  error helpers from there.
- Zod schemas in `src/lib/validation` validate both forms and mock services, so UI and data rules
  cannot drift silently.
- Domain mutations across organizations, users, classes, sections, courses, allocations and
  invitations write an audit entry via `recordAudit`, which powers the audit log, dashboard
  activity and search. Settings updates are not audited.
- React Query invalidates affected namespaces after mutations; optimistic behavior is intentionally
  avoided so mock latency and failures are visible.

## Identity and scoping

Relationships use IDs, never names:

| Identifier       | Used by                                                                  |
| ---------------- | ------------------------------------------------------------------------ |
| `organizationId` | organizations, users, classes, sections, allocations, invitations, audit |
| `classId`        | classes, sections, allocations                                           |
| `sectionId`      | sections, roster records, allocations                                    |
| `courseId`       | courses, allocations                                                     |
| `allocationId`   | allocations and revoke/edit actions                                      |
| `userId`         | users, administrators, section rosters, audit actors                     |

Cross-organization references are rejected by the mock services (`CROSS_ORGANIZATION`), including
moving a student who is already assigned to a section in another organization.

## Status vocabulary

| Entity                    | Statuses                                    |
| ------------------------- | ------------------------------------------- |
| Organization, user, class | `ACTIVE`, `INACTIVE`                        |
| Section                   | `ACTIVE`, `ARCHIVED`                        |
| Course                    | `DRAFT`, `ACTIVE`, `ARCHIVED`               |
| Allocation (computed)     | `SCHEDULED`, `ACTIVE`, `EXPIRED`, `REVOKED` |
| Invitation                | `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED` |

Inactive organizations block new users, classes and invitations. Archived sections reject roster
changes. Archived courses are read-only and cannot be allocated.

## Design system

Tokens are defined in `src/app/globals.css` with OKLCH colors and light/dark themes. Shared building
blocks live in `src/components/ui` (buttons, cards, dialogs, tables, form controls) and
`src/components/admin` (shell, page header, stat cards, data table, pagination, status badge,
confirm dialog, empty/error states). Status colors and labels come from centralized helpers so
tables, badges and charts stay consistent.

Accessibility: skip link, landmark regions, labelled form controls, focus-visible rings, keyboard
operable dialogs/menus and semantic table headers. Charts include accessible text alternatives
through surrounding summary content.

## Milestone boundaries

- No backend, database, real auth, email or payments.
- The route guard is cosmetic; see the README security note.
- Data persists per browser profile and can be reset from Settings.
- Feature-level rules are documented in the sibling guides; the mock contract and fixtures are in
  [mock services](mock-services.md).
