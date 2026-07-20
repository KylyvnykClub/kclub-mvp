# KCLUB MVP v4

KCLUB MVP v4 is a monorepo for an international private membership platform focused on the USA market. The MVP includes a public website, member cabinet, digital club cards, VIP subscriptions, partner directory, Business Introductions, and a staff admin dashboard.

## Architecture

Two deployable apps live in one repository:

| Workspace           | Purpose                                                                           |
| ------------------- | --------------------------------------------------------------------------------- |
| `apps/product-core` | Public website, member auth and cabinet, product APIs, Stripe webhooks, cron jobs |
| `apps/admin-app`    | Staff dashboard and staff auth shell                                              |

Shared packages live under `packages/*` and own contracts, validation, domain policies, database artifacts, UI primitives, config, and test utilities.

Package manager: `pnpm@9.15.9`

Task runner: `turbo`

## Core Docs

| Document                                                   | Purpose                                   |
| ---------------------------------------------------------- | ----------------------------------------- |
| [`docs/README.md`](docs/README.md)                         | Documentation index                       |
| [`docs/SPEC.md`](docs/SPEC.md)                             | Product and system source of truth        |
| [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md)                   | Monorepo technical blueprint              |
| [`AGENTS.md`](AGENTS.md)                                   | Rules for LLM agents working in this repo |
| [`docs/agents/README.md`](docs/agents/README.md)           | Specialized agent guides                  |
| [`docs/adr/README.md`](docs/adr/README.md)                 | Architecture decision records             |
| [`docs/development/README.md`](docs/development/README.md) | Phase-by-phase implementation prompts     |
| [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md)               | Environment variable contract             |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)                 | Deployment and rollback runbook           |
| [`docs/TESTING.md`](docs/TESTING.md)                       | Test strategy and command reference       |
| [`docs/SECURITY.md`](docs/SECURITY.md)                     | Security and privacy controls             |
| [`docs/RUNBOOKS.md`](docs/RUNBOOKS.md)                     | Operational incident procedures           |
| [`docs/RELEASE-CHECKLIST.md`](docs/RELEASE-CHECKLIST.md)   | Launch gate checklist                     |

## Local Development

Use Node.js 22 or newer. Corepack will select the repository-pinned pnpm version.

### Install Dependencies

```bash
corepack enable
pnpm install --frozen-lockfile
```

### Start Applications

You can start both applications concurrently via Turbo, or run them individually:

- **Start all apps**: `pnpm run dev` (Runs both apps)
- **Start Product Core**: `pnpm --filter @kclub/product-core dev` (Available at http://localhost:3000)
- **Start Admin App**: `pnpm --filter @kclub/admin-app-legacy dev` (Available at http://localhost:3002)

### Check Workspaces

Run quality checks across all workspaces:

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run build
```

To run checks on specific affected packages, use pnpm/Turbo filtering (for example, `pnpm exec turbo run build --filter=@kclub/product-core`).

## Deployment and Previews

- **Vercel Previews**: Pull Requests will automatically generate Preview Environments for both `product-core` and `admin-app`.
- **Production**: Merges to `main` will trigger production deployments. Do not configure or expose production secrets in local `.env` files. Use `.env.example` as a template for your local development variables.

## Working Model

- Use `docs/SPEC.md` for product behavior and constraints.
- Use `docs/BLUEPRINT.md` for repository layout and implementation boundaries.
- Use `docs/development/` to drive execution step by step.
- Keep product-core as the only owner of business logic, Stripe processing, and admin APIs.
- Keep admin-app as a UI client and proxy shell, never a direct database writer.

## Status

Documentation is now aligned around the monorepo architecture. Application scaffold and implementation follow the phase plan in `docs/development/`

## Migration
