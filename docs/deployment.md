# Deployment

Separate `staging` and `production` Environment dispatch workflows are present as blocked preparation gates. The target host is intentionally unspecified because none was provided. No workflow deploys until a hosting target, credentials, immutable build output and environment protections are configured. Production requires explicit environment approval. Do not place credentials in source or expose them to PR workflows.
