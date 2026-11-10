# Roadmap

This roadmap separates delivered work from planned work. Nothing under "Planned" exists in this
repository yet.

## Delivered — Milestone 1: Admin portal frontend

- Design system, admin shell, dark mode and mock sign-in
- Platform dashboard with summary metrics, growth and distribution charts
- Organization onboarding, directory, details, edits and activation
- User directory with student, teacher and administrator views, CSV import preview
- Class and section management with student and teacher rosters
- Course catalog with versioning and archive rules
- Course allocation with organization, class and section scopes
- Mock invitations with resend and revoke
- Reports, audit log, global search and platform settings
- Mock service layer with persisted fixtures, latency/failure simulation and audit capture
- Unit, integration and Playwright end-to-end tests; CI runs all checks

## Planned — future milestones

These items require decisions and repositories outside this frontend milestone. They are recorded
so the current boundaries stay explicit.

1. **Backend integration** — replace mock adapters with generated clients for the private backend;
   enforce authorization, organization isolation and audit persistence server-side.
2. **Real authentication** — OIDC/session handling owned by the backend; remove demo credentials
   and the mock cookie boundary.
3. **Teacher portal** — teacher-facing classes, rosters and course delivery views.
4. **Notifications and email delivery** — real invitation and digest delivery through a backend
   service.
5. **Billing and subscriptions** — out of scope until product requirements are defined.

## Known gaps in Milestone 1

- Route protection is cosmetic; it is not security.
- All data lives in localStorage and resets per browser profile.
- Invitations, notifications and exports are simulated.
- Reports are snapshots over the mock dataset, not scheduled jobs.
- Component-level test coverage is representative, not exhaustive; end-to-end coverage is a single
  golden path plus authentication-boundary checks.
