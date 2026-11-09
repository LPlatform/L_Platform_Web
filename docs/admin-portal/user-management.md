# User and administrator management

People are stored as a single `User` record with a role and an optional organization. The portal
exposes one unified directory plus role-specific views.

Routes: `/admin/users`, `/admin/users/new`, `/admin/users/[userId]`,
`/admin/users/[userId]/edit`, `/admin/administrators`, `/admin/administrators/new`,
`/admin/teachers`, `/admin/students`.

## Roles

| Role                 | Organization | Notes                                                                                          |
| -------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `PLATFORM_ADMIN`     | None         | Seeded account only; cannot be created, edited or deactivated from organization administration |
| `ORGANIZATION_ADMIN` | Required     | Managed through the administrators view                                                        |
| `TEACHER`            | Required     | Can be assigned to section teacher rosters                                                     |
| `STUDENT`            | Required     | Can be assigned to section student rosters                                                     |

Each user has a public ID (`USR-YYYY-#####`), name, optional email and username, status, timestamps
and last activity. At least one of email or username is required for students; the general user
form requires email.

## Directory

- Search matches name, email, username and public ID.
- Filters: organization, role and status, depending on the view.
- Teachers and students views preselect the role filter and reuse the same table.
- Administrators default to `ORGANIZATION_ADMIN`; the `ALL` sentinel falls back to that role.
- Row actions: open profile, edit, activate/deactivate. Export follows the active query.

The unified `/admin/users` view is a role-aware directory. Detail pages show profile data,
organization, permissions for administrators and section memberships for students and teachers.

## Creating a user

The form validates names, email, role and organization with `userInputSchema`:

- `PLATFORM_ADMIN` is rejected by the service even if the UI is bypassed.
- Non-platform roles require an organization; platform administrators must not have one.
- The organization must exist and be `ACTIVE`.
- Email and username must be unique (case-insensitive).
- Creation produces a public ID and a `USER_CREATED` audit event.

Administrator creation forces the role to `ORGANIZATION_ADMIN`. Updates and status changes for a
`PLATFORM_ADMIN` are rejected with `CONFLICT`.

## Editing and status

- Role is immutable after creation; all other identity fields can be edited.
- Moving a student or teacher to another organization is blocked while they remain on any section
  roster (`CONFLICT`). Remove roster assignments first.
- A user cannot deactivate the account they are signed in with.
- Status changes record `USER_ACTIVATED` or `USER_DEACTIVATED` audit events.

## CSV import

The import dialog accepts a CSV with required headers `firstName`, `lastName` and `role`, plus
`email`, `username` and an organization reference (`organizationId`, `organizationPublicId` or
`organization`; public ID and slug are accepted).

1. **Preview** parses the file, validates each row, resolves the organization and flags duplicates
   against the database and earlier rows. Invalid rows keep row-level messages.
2. **Confirm** imports only `VALID` rows as `ACTIVE` users. Duplicates and rows whose organization
   is missing or inactive are skipped. The result reports created and skipped counts.

## Permissions catalog

The administrator detail view lists the mock permission definitions: manage users, classes and
sections, view organization courses, manage course allocations and view reports. These are
descriptive only; enforcement belongs to the backend.

## Invitations

Invited members are not users until accepted. Invitations are mock operations documented in the
[overview](overview.md); no email is sent and no credentials are created.

## Seed fixtures

The dataset includes a platform administrator (Aarav Mehta), organization administrators, teachers
and students across five organizations, with Riverside Public School as the largest cohort.
