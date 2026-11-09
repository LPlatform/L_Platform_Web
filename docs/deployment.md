# Deployment

Prepare separate `staging` and `production` GitHub Environments. The target host is intentionally unspecified because none was provided. No deploy workflow may publish until a hosting target, credentials, immutable build output and environment protections are configured. Production requires explicit environment approval. Do not place credentials in source or expose them to PR workflows.
