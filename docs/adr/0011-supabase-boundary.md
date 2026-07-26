# ADR 0011: Supabase Boundary

## Status

Accepted

## Context

The system needs hosted PostgreSQL, member identity infrastructure, and object storage. These infrastructure concerns must be separated from application-level authorization and domain policy.

## Decision

Supabase provides hosted PostgreSQL, member identity infrastructure, and object storage. Product-core remains the authorization and domain-policy authority. Supabase secret keys and direct database access are server-only. Staging and production use isolated projects; public and private storage have separate access policies.

## Consequences

- Supabase handles infrastructure: database hosting, auth sessions, file storage.
- Product-core enforces all business rules and authorization.
- No Supabase secret keys or service-role access on the client.
- Staging and production environments are fully isolated at the Supabase project level.

## Alternatives Considered

- Self-hosted PostgreSQL with custom auth.
- Firebase for identity and storage.
- Separate providers for database, auth, and storage.
