# Class and section management

Academic structure is two levels: **classes** belong to an organization and an academic year;
**sections** belong to a class and hold teacher and student rosters. Allocations can target a whole
organization, a class or a single section.

Routes: `/admin/classes`, `/admin/classes/new`, `/admin/classes/[classId]`,
`/admin/classes/[classId]/edit`, `/admin/sections`, `/admin/sections/new`,
`/admin/sections/[sectionId]`, `/admin/sections/[sectionId]/edit`.

## Classes

| Field         | Rules                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Name          | 1–60 chars, unique per organization **and** academic year (case-insensitive) |
| Organization  | Required, must be `ACTIVE` to create                                         |
| Academic year | `YYYY-YY` (for example `2026-27`)                                            |
| Description   | Optional, up to 300 chars                                                    |
| Status        | `ACTIVE` or `INACTIVE`                                                       |

- The class list supports organization, status and academic-year filters, search, sorting,
  pagination and export.
- Class details show section, student, teacher and allocated-course counts, plus its sections and
  related users.
- Editing cannot change the organization. Activating a class requires its organization to be
  active.
- Class creation and status changes record `CLASS_CREATED`, `CLASS_UPDATED` and status audit events.

## Sections

| Field       | Rules                               |
| ----------- | ----------------------------------- |
| Class       | Required; resolves the organization |
| Name        | 1–40 chars, unique within the class |
| Description | Optional, up to 200 chars           |
| Status      | `ACTIVE` or `ARCHIVED`              |

Sections can only be created inside an `ACTIVE` class whose organization is `ACTIVE`. Archiving a
section keeps its rosters and history but blocks roster changes; restoring it re-enables them.

## Rosters

The section detail page exposes two dialogs:

- **Assign students** / **Assign teachers** — search eligible people in the section's
  organization, select one or more, and confirm. The service reports how many were assigned or
  skipped.
- **Remove** — removes a single roster record after confirmation.

Assignment rules:

- The section and its organization must be active.
- The user must be `ACTIVE`, have the expected role and belong to the section's organization.
- A student may hold only one section within a given class. Assigning them to a second section in
  the same class is skipped; roster counts reflect only new assignments.
- Duplicate input IDs are deduplicated before assignment.
- Bulk student assignment accepts CSV rows with `email` or `username`, matches only students in
  the section's organization and returns row-level errors for unmatched rows.

Successful roster changes record `STUDENT_ASSIGNED`, `STUDENT_REMOVED`, `TEACHER_ASSIGNED` and
`TEACHER_REMOVED` audit events scoped to the section's organization.

## Sections and allocation

Section-scoped allocations affect only active students on that section's roster. Class-scoped
allocations aggregate every section in the class. Removing a student from a section therefore
changes allocation reach; see [course allocation](course-allocation.md).

## Related guards

- A student or teacher on any section roster cannot be moved to another organization until removed.
- Inactive organizations cannot receive new classes or sections.
