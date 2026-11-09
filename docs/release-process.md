# Release process

Use SemVer and `web-vMAJOR.MINOR.PATCH` tags from `main`. The tag workflow validates the format and main ancestry, runs format/lint/typecheck/tests/build, uploads the production `.next` artifact, then generates GitHub Release notes. It refuses to replace an existing GitHub Release. Tag update/deletion protection is not available on the current private-repo plan. `CHANGELOG.md` remains reviewed manually; release automation does not rewrite it.

The package and host are not configured, so no release has been tested. Establish one version of record in the package manifest. Production deployment remains blocked until a provider, protected Environment reviewers and credentials exist. Roll back by redeploying a prior immutable build artifact.
