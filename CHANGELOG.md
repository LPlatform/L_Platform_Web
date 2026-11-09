# Changelog

All notable changes to this repository are documented here. The tag workflow generates GitHub
Release notes from merged changes; it does not rewrite this file. This project follows
[Semantic Versioning](https://semver.org/); no releases exist yet.

## [Unreleased]

### Added

- Admin portal shell, design system, dark mode, mock sign-in and session boundary.
- Platform dashboard with summary metrics, student growth, organization distribution, recent
  organizations, invitations and audit activity.
- Organization management: onboarding with initial administrator invitation, directory with
  filters, details with statistics, editing and activation.
- User and administrator management: unified directory, role views, creation and editing,
  permissions catalog and CSV import preview/confirm.
- Class and section management with teacher and student rosters and bulk student assignment.
- Course catalog with duplicate-title prevention, version increments on edit and archive rules.
- Course allocation with organization, class and section scopes, availability checks, affected
  student counts, editing and revocation.
- Mock invitations with resend and revoke; no email is sent.
- Reports (six definitions with CSV export), audit log with filters and export, global search and
  platform settings with demo-data reset.
- Mock service layer with versioned localStorage persistence, seed fixtures, latency and failure
  simulation, validation and audit capture.
- Unit and integration tests for schemas, CSV helpers, services and shared components.
- Playwright end-to-end tests for the authentication boundary and an administrative golden path.
- Milestone documentation in `docs/admin-portal/`, a roadmap and a CI end-to-end job.

### Fixed

- Audit log filtering treated the `ALL` action sentinel as a literal action, which returned zero
  events on the default page. The service now ignores `ALL`, matching every other list service.
