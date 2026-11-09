# GitHub settings and outstanding setup

Squash-only merging and read-only Actions defaults are enabled. GitHub returned `Upgrade to GitHub Pro or make this repository public` for the private repo branch-protection/ruleset APIs. Keep both repositories private. The owner must upgrade the plan or apply an organization-level ruleset before `main` can require PRs/status checks, conversation resolution, linear history, and force-push/deletion protection.

Also protect `web-v*` release tags from update/deletion when the plan permits. Keep required approval count at zero for the solo owner. No tag protection is active for this private repo. Require only status checks observed after the product jobs have run; do not require the currently skipped security jobs.

Dependabot alerts and security updates and read-only default Actions permissions are enabled. Private secret scanning/push protection and CodeQL/dependency review require plan features that are unavailable now. The owner must select a hosting target, configure staging and production Environments, add production reviewers/branch restrictions, and store credentials in the selected Environment before enabling deploy steps. No deployment occurs now.
