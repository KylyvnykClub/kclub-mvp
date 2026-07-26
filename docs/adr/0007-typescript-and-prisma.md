# ADR 0007: Strict TypeScript and Prisma

## Status

Accepted

## Context

The system has numerous permissions, lifecycle states, DTOs, and financial records. Compile-time contracts materially reduce ambiguity across these domains. The ORM and migration system must support reviewed, CI-deployed schema changes against core PostgreSQL.

## Decision

All application code is strict TypeScript. Prisma is the ORM and migration system for core PostgreSQL. Migrations are reviewed and deployed through protected CI.

## Consequences

- Type errors surface at compile time rather than runtime.
- Prisma generates typed clients from the schema, keeping queries aligned with the database.
- Schema changes require reviewed migration files.
- Third-party integrations must have or generate TypeScript types.

## Alternatives Considered

- JavaScript with JSDoc type annotations.
- Drizzle ORM instead of Prisma.
