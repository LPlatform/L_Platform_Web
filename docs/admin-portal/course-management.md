# Course management

The course catalog is platform-wide: courses do not belong to an organization. Organizations gain
access through [course allocations](course-allocation.md).

Routes: `/admin/courses`, `/admin/courses/new`, `/admin/courses/[courseId]`,
`/admin/courses/[courseId]/edit`.

## Fields

| Field       | Rules                                                     |
| ----------- | --------------------------------------------------------- |
| Title       | 3–120 chars, unique across the catalog (case-insensitive) |
| Description | 10–600 chars                                              |
| Category    | 2–60 chars, free text                                     |
| Language    | `PYTHON`, `JAVA`, `CPP`                                   |
| Difficulty  | `BEGINNER`, `INTERMEDIATE`, `ADVANCED`                    |
| Status      | `DRAFT`, `ACTIVE`, `ARCHIVED`                             |

Each course also carries a public ID (`CRS-YYYY-####`), a version starting at 1, and timestamps.

## Lifecycle

- **Draft** — catalogued but not offered. `listOptions` excludes it from allocation forms.
- **Active** — required before a course can be allocated. Existing allocations are unaffected if
  the course later leaves active status, but new allocations are rejected with
  `COURSE_UNAVAILABLE`.
- **Archived** — read-only. Edits are rejected with `CONFLICT`. Archives cannot be allocated.
  Changing status back to draft or active restores editability.

Editing any non-archived course increments `version` and records `COURSE_UPDATED` with the new
version in the audit metadata. Status changes record `COURSE_ACTIVATED`, `COURSE_ARCHIVED` or
`COURSE_UPDATED`.

## Catalog experience

- Search matches title and category.
- Filters: language, difficulty and status.
- Columns include course identity with version, language, difficulty, allocation count, affected
  student reach and status.
- Table sorting, pagination and CSV export share the list query.

## Detail page

Shows the course summary with status, version, language and difficulty badges, three statistics
(allocation count, active student reach and catalog version), catalog details, and the
allocations that reference the course. Allocation rows link to their detail page; the empty state
offers an allocate action only while the course is active.

## Domain events

`COURSE_CREATED`, `COURSE_UPDATED`, `COURSE_ACTIVATED`, `COURSE_ARCHIVED`.
