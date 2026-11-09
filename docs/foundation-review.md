# Foundation PR review — Web

Review date: 2026-11-09. Reviewed PR #1's complete diff, all workflow YAML, repository docs/tests and available GitHub settings. The PR remains open and unmerged.

## Findings and changes

| Priority    | Finding                                                                                                                             | Disposition                                                                                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical    | The prior CI job exited successfully after skipping all product checks, so the job looked like product CI.                          | Split `bootstrap-smoke` from `web-product-ci`. The product job now has an explicit skipped check until `package.json` exists, then requires the frozen lockfile and all scripts, tests and `pnpm build`.            |
| Critical    | Release step used `TAG` outside the step where it was set, and release publication had no built artifact or existing-release check. | Reworked into read-only build and write-only publish jobs. Tag format/main ancestry are checked, a real `.next` output is required and uploaded, and an existing release is refused. Tag concurrency is serialized. |
| Important   | Release workflow held write permission for every step; workflow had no release concurrency.                                         | Default is read-only; only publish gets `contents: write`/`actions: read`. Release concurrency is non-cancelling.                                                                                                   |
| Important   | Deployment preparation jobs could be manually dispatched from any ref.                                                              | Restricted jobs to `main`, added per-environment concurrency, and kept them blocked until a host, artifact store and credentials exist. No deployment command is present.                                           |
| Improvement | Runtime version was floating and no dependency cache was configured.                                                                | Added `.nvmrc` (Node 24.22.1) and pnpm cache keyed by `pnpm-lock.yaml`; cache/build path only runs after product initialization.                                                                                    |
| Improvement | Bootstrap tests were easy to confuse with application tests.                                                                        | Named them explicitly and added tests asserting product checks are separate. These tests verify policy/docs/action pins only.                                                                                       |

Third-party Actions are pinned to full commit SHAs. YAML parsing and SHA-pin checks were performed locally. No package scripts or app source exist, so application lint/typecheck/tests/build have not run. `actionlint` is unavailable. Dependency caching has not been exercised because no lockfile exists.

## Release/security readiness

GitHub-generated release notes are enabled. `CHANGELOG.md` is maintained through reviewed changes and is not auto-rewritten. The repository has no automatic version-bump PR/version-of-record manifest, and no release has been built. GitHub blocked private-repo ruleset/branch-protection APIs with “Upgrade to GitHub Pro or make this repository public”; no `main` or `web-v*` tag protection is active. Keep this repository private; the owner must upgrade the plan or apply an organization policy. Private CodeQL and dependency review also require eligible GitHub Code Security licensing. Dependabot alerts/security updates and read-only Actions defaults are enabled.

Staging/production Environments and host are absent. The owner must select a host, create Environments, set production reviewers and allowed deployment refs, then add credentials to the Environment. No secrets are embedded here.

Verified PR head `5499a4b`: `bootstrap-smoke` passed; `web-product-ci`, CodeQL and dependency review were explicitly skipped. The PR status is clean. No product build/test is claimed. The report-only follow-up commit also reruns bootstrap CI.
