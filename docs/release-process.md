# Release process

Use SemVer and `web-vMAJOR.MINOR.PATCH` tags. `main` is the only release source. Conventional Commit PR titles support release notes; squash merge is recommended. A release candidate must pass the complete PR checks before its tag is created. Never overwrite tags or reuse artifacts. Preserve prior releases.

The web package and host are not configured yet. Establish one version of record in the eventual package manifest, and generate release notes from merged changes. Publish production only through a protected GitHub Environment after configuring a hosting target and credentials. Roll back by redeploying the prior immutable release artifact; no target is configured today.
