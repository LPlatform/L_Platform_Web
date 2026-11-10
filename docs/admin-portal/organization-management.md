# Organization management

Organizations are the tenant boundary of the platform. Every user, class, section, allocation,
invitation and audit event carries an `organizationId`.

Routes: `/admin/organizations`, `/admin/organizations/new`,
`/admin/organizations/[organizationId]`, `/admin/organizations/[organizationId]/edit`.

## Directory

- Search matches name, slug and contact email.
- Filters: status (`ACTIVE`, `INACTIVE`) and type.
- Columns: organization (name, public ID, type), contact, location, members, status, updated time.
- Pagination, sorting and CSV export use the same query as the list.

## Onboarding an organization

The create form collects identity, contact, address and the initial administrator:

| Group    | Fields and rules                                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity | Name (2–120 chars), slug (lowercase letters, numbers, single hyphens), type (`SCHOOL`, `COLLEGE`, `COACHING_INSTITUTE`, `TRAINING_INSTITUTE`, `OTHER`), status |
| Contact  | Contact name (2–100), contact email, phone (7–20 chars, digits/spaces/hyphens, optional `+`)                                                                   |
| Address  | Address, city, state, country, postal code                                                                                                                     |
| Access   | Initial administrator email                                                                                                                                    |

The slug is derived from the name with `slugify` as the user types until they edit the slug field
directly.

One submission:

1. Validates the payload with `organizationInputSchema`.
2. Rejects duplicate slug, duplicate contact email (case-insensitive) and duplicate name
   (case-insensitive).
3. Rejects an administrator email that already belongs to a user or has a pending invitation.
4. Creates the organization with zero statistics.
5. Creates a `PENDING` **organization administrator** invitation addressed to the initial
   administrator, expiring in seven days. No email is sent.
6. Records `ORGANIZATION_CREATED` and `INVITATION_CREATED` audit entries.

On success the browser navigates to the organization detail page and shows a toast.

## Detail page

- Header: public ID, name, type, location, created/updated timestamps and status badge.
- Actions: edit details and activate/deactivate (confirmation dialog).
- Statistics: active students, teachers, classes (with allocated courses) and administrators.
- Contact card, address card and recent activity scoped to the organization.
- Related data links: classes, users, allocations and invitations pre-filtered by
  `organizationId` where the target page supports it.

## Editing and activation

- Update uses the same validation minus the initial administrator email.
- Uniqueness checks exclude the current organization.
- Activating or deactivating records an audit event and immediately changes downstream
  availability.

## Inactive organizations

When an organization is `INACTIVE`:

- New users cannot be created for it.
- New classes and sections cannot be created.
- New invitations cannot be created.
- Existing records stay visible and remain auditable.

These rules are enforced in the mock services, not only in the UI, so direct service calls are
rejected with `ORGANIZATION_INACTIVE` (HTTP 409 semantics).

## Seed fixtures

The mock dataset contains five organizations: Riverside Public School, Greenwood International,
BrightPath Learning, Nova Institute (inactive) and Horizon Academy. They vary by type, location,
member counts and allocation activity. See [mock services](mock-services.md#seed-dataset).

## Testing hooks

Service integration tests in `src/lib/mock/services/services.test.ts` cover creation, duplicate
checks, the initial invitation and audit entries. The Playwright golden path onboards a new
organization and exercises its downstream invitations and allocations.
