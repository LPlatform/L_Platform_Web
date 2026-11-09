# API contract integration

The backend owns the API contract. The intended flow is: backend generates OpenAPI, validates it, publishes a versioned immutable artifact; this repository consumes a pinned version, regenerates its client and runs compatibility checks. Breaking changes require explicit review and coordinated versioning. Never copy backend source or hand-maintain duplicate API models.

No OpenAPI producer, artifact registry, consumer or client generation is configured yet. Do not claim contract compatibility until this pipeline exists.
