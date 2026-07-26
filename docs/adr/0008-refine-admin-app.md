# ADR 0008: Refine for the Operations Admin

## Status

Accepted

## Context

Admin-app needs CRUD resource routing, data access abstractions, authentication integration, and access-control-aware UX. Building these from scratch for an internal operations tool is unnecessary overhead.

## Decision

`apps/admin-app` uses Refine.dev for CRUD/resource routing, data access abstractions, authentication integration, and access-control-aware administrative UX. Refine does not own data, authorization, or business transitions; it is a React operational client over product-core APIs.

## Consequences

- Admin-app gets consistent resource routing and data-provider patterns out of the box.
- Business logic and authorization remain in product-core (ADR 0004).
- Refine upgrades may require adapting data-provider or auth-provider wiring.
- Custom admin flows that do not fit Refine's resource model are built as plain React pages.

## Alternatives Considered

- Custom admin UI built from scratch with Next.js pages.
- Retool or other low-code admin builder.
