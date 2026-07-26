# Architecture Decision Records

ADRs record decisions that affect architecture, implementation boundaries, infrastructure, security, or long-term maintenance.

## Format

Each ADR uses:

- Status
- Context
- Decision
- Consequences
- Alternatives Considered

## Status Values

- Proposed
- Accepted
- Superseded

## Index

| ADR                                                                                    | Status   | Decision                                                                              |
| -------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| [`0001-monorepo-architecture.md`](0001-monorepo-architecture.md)                       | Accepted | Use one Bun/Turbo monorepo with two deployable apps                                   |
| [`0002-bun-turbo-tooling.md`](0002-bun-turbo-tooling.md)                               | Accepted | Use Bun as package manager and Turborepo as task runner                               |
| [`0003-shared-package-boundaries.md`](0003-shared-package-boundaries.md)               | Accepted | Keep contracts, validation, domain, database, UI, config, and test utilities separate |
| [`0004-product-core-admin-api-ownership.md`](0004-product-core-admin-api-ownership.md) | Accepted | Product-core owns admin APIs and business logic                                       |
| [`0005-staff-auth-totp.md`](0005-staff-auth-totp.md)                                   | Accepted | Staff auth uses OWNER-approved phones plus passwords                                  |
| [`0006-stripe-webhooks-source-of-truth.md`](0006-stripe-webhooks-source-of-truth.md)   | Accepted | Stripe webhooks drive billing state changes                                           |
| [`0007-typescript-and-prisma.md`](0007-typescript-and-prisma.md)                       | Accepted | Strict TypeScript and Prisma for type safety and migrations                           |
| [`0008-refine-admin-app.md`](0008-refine-admin-app.md)                                 | Accepted | Refine.dev powers admin-app CRUD and resource routing                                 |
| [`0009-directus-cms-only.md`](0009-directus-cms-only.md)                               | Accepted | Directus manages public content only, isolated from core domain                       |
| [`0010-token-driven-ui.md`](0010-token-driven-ui.md)                                   | Accepted | Shared UI tokens and primitives in packages/ui                                        |
| [`0011-supabase-boundary.md`](0011-supabase-boundary.md)                               | Accepted | Supabase provides infrastructure; product-core owns authorization                     |
| [`0012-app-router-i18n.md`](0012-app-router-i18n.md)                                   | Accepted | next-intl with locale-prefixed App Router routing                                     |
| [`0013-lucide-react-icons.md`](0013-lucide-react-icons.md)                             | Accepted | lucide-react as the shared icon source                                                |
