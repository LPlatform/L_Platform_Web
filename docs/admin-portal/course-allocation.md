# Course allocation

Allocations grant organizations, classes or sections access to a course for a date window. They
are the only mechanism that connects the platform-wide course catalog to tenants.

Routes: `/admin/allocations`, `/admin/allocations/new`, `/admin/allocations/[allocationId]`,
`/admin/allocations/[allocationId]/edit`.

## Scope model

| Scope          | Target             | Affected learners                             |
| -------------- | ------------------ | --------------------------------------------- |
| `ORGANIZATION` | Whole organization | All active students in the organization       |
| `CLASS`        | One class          | Active students in every section of the class |
| `SECTION`      | One section        | Active students on that section's roster      |

Only active students count. The service computes `affectedStudentCount` dynamically, so roster
changes alter reach without editing the allocation.

## Fields and validation

| Field            | Rules                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| Course           | Required and `ACTIVE`                                                            |
| Organization     | Required and `ACTIVE`                                                            |
| Scope            | `ORGANIZATION`, `CLASS` or `SECTION`; the form derives it from the chosen target |
| Class            | Required for class and section scopes; must be `ACTIVE` and in the organization  |
| Section          | Required for section scope; must belong to the selected class and be `ACTIVE`    |
| Start / end date | Both required; end must be later than start                                      |
| Access enabled   | Toggle stored on the record                                                      |

## Creation flow

The form uses a two-step confirm: review the summary, then confirm in a dialog. On submit the
service:

1. Validates the payload with `allocationInputSchema` and re-derives the scope from the provided
   target IDs.
2. Rejects a non-active course (`COURSE_UNAVAILABLE`).
3. Rejects an inactive organization (`ORGANIZATION_INACTIVE`).
4. Rejects students/classes from another organization or a section that does not belong to the
   selected class (`CROSS_ORGANIZATION`).
5. Rejects inactive classes and archived sections for new allocations.
6. Rejects a duplicate non-revoked, non-expired allocation for the same course and exact target
   (`DUPLICATE_ALLOCATION`).
7. Persists the allocation and records `COURSE_ALLOCATED`.

The allocation date window determines its effective status immediately.

## Effective status

| Status      | Meaning                              |
| ----------- | ------------------------------------ |
| `REVOKED`   | Explicitly revoked (`revokedAt` set) |
| `EXPIRED`   | End date has passed                  |
| `SCHEDULED` | Start date is in the future          |
| `ACTIVE`    | Current time is inside the window    |

`accessEnabled` is stored separately from the computed status; revoking forces it to `false`.

## Directory and detail

- Filters: organization, course, status and scope; search matches course, organization, class,
  section and public ID.
- Columns: course, target, scope, affected learners, window and status.
- Detail page shows course and target summary, dates, affected learner count, the calculation
  explanation and audit history. Revoked allocations show the revocation timestamp.
- Revoking asks for confirmation, sets `revokedAt`, disables access and records
  `COURSE_ALLOCATION_REVOKED`. Revoked and expired records remain for history.
- Editing is limited to dates and the access toggle. Revoked allocations cannot be edited; create a
  new allocation instead. Edits record `ALLOCATION_UPDATED`.

## Practical constraints

- An allocation does not prevent a course from being archived; existing rows remain but new
  allocations require an active course.
- Duplicate detection ignores revoked and expired rows, so re-allocating after expiry is allowed.
- Overlapping windows for the same target are allowed; only exact recomputation of the same target
  is blocked while a record is active or scheduled.
