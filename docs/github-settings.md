# GitHub settings and outstanding setup

The account can administer these repositories. Recommended squash-only merging is enabled by repository settings. Branch rulesets and branch-protection APIs return a plan/visibility restriction for the two private repositories; do not make either repository public to work around it.

After a PR workflow has completed once, set `main` protections where the plan permits: require a PR, require the CI and dependency-review checks, require conversation resolution, enforce linear history, and block force pushes and branch deletion. Keep required approval count at zero for the solo owner. If protections remain unavailable, upgrade the plan or apply equivalent organization policy; do not claim protection is active. Require only status checks actually observed on PR runs.

Enable Dependabot alerts, dependency graph, secret scanning and push protection in Settings → Code security and analysis when plan permits. YAML and workflows alone do not turn on these platform features. Add a staging host/credentials and production host/credentials only after choosing a provider; use protected GitHub Environments. Set Actions default token permissions to read-only; release workflows request write access locally.
