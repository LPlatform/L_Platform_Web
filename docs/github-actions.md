# GitHub Actions

`ci.yml` is the PR/main foundation gate. `security.yml` runs CodeQL; `dependency-review.yml` reviews PR dependency changes; Dependabot is scheduled weekly. `release.yml` validates independently versioned `web-vX.Y.Z` tags and publishes GitHub release notes. Workflows use least privilege and pin external Actions by full commit SHA.

At audit time there was no package manifest, lockfile, Next.js app, test suite or host. Product checks cannot honestly be reported as passing until that project foundation exists. Current GitHub run: foundation CI passes; CodeQL has no source to analyze and requires a supported visibility/plan; dependency review is unavailable on this private repository under the current plan. Enable dependency graph/Dependabot, secret scanning and push protection in repository settings where plan and policy permit. Set required PR checks only after their names appear on a real PR run.
