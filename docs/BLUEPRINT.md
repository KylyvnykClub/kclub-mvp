# KCLUB MVP v4 Monorepo Blueprint

| Field            | Value                 |
| ---------------- | --------------------- |
| Document version | `2.0.0`               |
| Aligned spec     | `docs/SPEC.md` v0.3.0 |
| Status           | Ready for scaffolding |
| Last updated     | 2026-06-13            |

## 1. Summary

KCLUB MVP v4 should be built as a monorepo, not as two separate repositories.

The product has two deployable apps:

- `apps/product-core`: public website, member cabinet, product API, admin API, Stripe webhooks, cron jobs.
- `apps/admin-app`: staff dashboard and staff auth shell that consumes product-core admin APIs.

The shared code that must not drift lives in `packages/*`: contracts, validation, domain policies, database schema/migrations, UI primitives, config, and test utilities.

This keeps API changes atomic, prevents duplicate DTO and permission definitions, makes CI aware of cross-app breakage, and still allows separate Vercel deployments for product and admin.

## 2. Repository Layout

```text
kclub-mvp-v4/
  apps/
    product-core/
      src/
        app/
          [locale]/
            (marketing)/
            (auth)/
            (member)/
          api/
            v1/
            admin/v1/
            stripe/webhook/
            cron/daily-maintenance/
        server/
          auth/
          db/
          stripe/
          services/
          api/
        features/
        components/
        messages/
      next.config.ts
      package.json
      vercel.json

    admin-app/
      src/
        app/
          (auth)/
          (dashboard)/
          api/proxy/[...path]/
        server/
          auth/
          proxy/
        features/
        components/
      next.config.ts
      package.json
      vercel.json

  packages/
    contracts/
      src/
        api/
        dto/
        errors/
        permissions/
        routes/
    validation/
      src/
        business.ts
        introduction.ts
        onboarding.ts
        staff-auth.ts
    domain/
      src/
        business-policy.ts
        card-policy.ts
        subscription-policy.ts
        introduction-policy.ts
        rbac-policy.ts
    database/
      migrations/
      seeds/
      src/
        generated/
        schema-docs/
    ui/
      src/
        components/
        tokens/
        styles/
    config/
      eslint/
      tailwind/
      typescript/
      env/
    test-utils/
      src/
        factories/
        fixtures/
        contract-assertions/

  docs/
    SPEC.md
    BLUEPRINT.md
    review.md

  package.json
  bun.lock
  turbo.json
  tsconfig.base.json
  eslint.config.mjs
  README.md
```

## 3. Tooling Decision

### 3.1 Package Manager

Use **Bun** as the default package manager for MVP v4.

Reasons:

- Bun supports workspaces in `package.json`, which fits the `apps/*` and `packages/*` monorepo model.
- Bun supports filtering workspace operations, useful for app/package scoped tasks.
- Bun catalogs can centralize dependency versions across packages.
- Install and script execution speed is useful during early product build-out.

Guardrails:

- Pin Bun in root `package.json` through `packageManager`.
- Commit only `bun.lock`.
- Do not mix npm, pnpm, or yarn lockfiles.
- Do not assume Bun runtime for production Next.js unless verified.
- Keep Vercel/Next.js deployments on the standard supported runtime path.
- If a critical tool has Bun package-manager issues, switch the monorepo to `pnpm`; do not split repos.

### 3.2 Root package.json

```json
{
  "name": "kclub-mvp-v4",
  "private": true,
  "packageManager": "bun@1.3.3",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "typecheck": "turbo typecheck",
    "lint": "turbo lint",
    "test": "turbo test",
    "test:contracts": "turbo test --filter=@kclub/contracts --filter=@kclub/test-utils",
    "format": "prettier --check ."
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "latest",
    "prettier": "latest"
  }
}
```

Use the exact Bun version current at scaffold time; update this blueprint if the project pins a different version.

### 3.3 Turbo Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## 4. Shared Package Responsibilities

### 4.1 `@kclub/contracts`

Owns API contracts and values that both apps must consume.

Contents:

- API response envelope.
- DTOs for users, cards, businesses, subscriptions, introductions, audit records.
- Error code constants.
- Permission constants.
- Shared API route type helpers.
- Public vs admin DTO separation.

Rules:

- No DB client imports.
- No Stripe imports.
- No server secrets.
- No React imports.

### 4.2 `@kclub/validation`

Owns input schemas.

Contents:

- Member onboarding schema.
- Business profile submission schema.
- Business editable-fields schema.
- Introduction submission schema.
- Staff password auth schema.
- Shared phone, URL, locale, pagination, and ID validators.

Rules:

- Use Zod.
- Return structured validation errors that map to contract error codes.
- Keep schemas app-agnostic.

### 4.3 `@kclub/domain`

Owns pure business policies.

Contents:

- Business status transition matrix.
- Card lifecycle rules.
- VIP capability rules.
- Introduction rate/cooldown decision helpers.
- RBAC permission checks.
- Featured business max-count policy constants.

Rules:

- Pure TypeScript only.
- No DB, HTTP, cookies, Stripe, or Supabase SDK.
- Must be unit tested heavily.

### 4.4 `@kclub/database`

Owns schema and migrations.

Contents:

- SQL migrations.
- RLS policies where used.
- Generated database types.
- Seed data for local/dev.
- Schema docs and relationship diagrams.

Rules:

- App server modules import generated types from here.
- Runtime service-role clients stay in app server code.
- Migration PRs must include affected contract/domain updates.

### 4.5 `@kclub/ui`

Owns shared UI primitives and design tokens.

Contents:

- Button, input, form field, dialog, table, badge, tabs, toast primitives.
- Shared layout primitives where generic.
- Design tokens and Tailwind preset.

Rules:

- Keep product flows in apps, not in shared UI.
- Components must be accessible and responsive by default.
- Product-core and admin-app may compose primitives differently.

### 4.6 `@kclub/config`

Owns shared tooling config.

Contents:

- TypeScript base config.
- ESLint config.
- Tailwind preset.
- Env schema helpers.

### 4.7 `@kclub/test-utils`

Owns test helpers.

Contents:

- Domain factories.
- DTO fixtures.
- Mock Stripe event builders.
- Contract compatibility assertions.
- Permission matrix test helpers.

## 5. Application Responsibilities

### 5.1 Product-Core

Product-core owns the product backend and public/member UI.

Responsibilities:

- Public localized marketing pages.
- Directory pages.
- Public card verification page.
- Member sign-in/sign-up.
- Member onboarding and dashboard.
- Member APIs under `/api/v1`.
- Admin APIs under `/api/admin/v1`.
- Stripe webhook route.
- Daily maintenance cron route.
- Server-side integration with Supabase, Stripe, email, and audit logging.

Product-core imports shared packages for contracts, validation, domain policies, database types, UI primitives, and config.

Product-core must not import admin-app code.

### 5.2 Admin-App

Admin-app owns staff UX and staff session shell.

Responsibilities:

- Staff sign-in UI.
- Staff password registration and sign-in.
- Admin dashboard pages.
- Operational data tables and forms.
- BFF/proxy route to product-core admin API.
- Staff session cookie and admin route gating.

Admin-app imports shared packages for contracts, validation, domain policies, UI primitives, and config.

Admin-app must not write directly to product database tables. All state changes go through product-core admin APIs.

## 6. Data Model

Core tables:

- `users`
- `member_cards`
- `vip_subscriptions`
- `subscriptions`
- `business_profiles`
- `business_introductions`
- `categories`
- `countries`
- `cities`
- `admin_users`
- `admin_2fa`
- `admin_sessions`
- `audit_logs`
- `admin_config`
- `stripe_webhook_events`

Important constraints:

- One active club card per user.
- Unique card number platform-wide.
- Business slug unique.
- A user may have at most one non-rejected active business submission.
- Featured top and recommended counts are capped at 3 each.
- Staff and member identities are separate tables and auth contexts.

Use database constraints for invariants that protect data integrity. Use domain policies and service checks for state transitions, permissions, and user-facing errors.

## 7. API Design

All JSON APIs use the shared response envelope:

```ts
export type ApiResponse<T> = {
  data: T | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp?: string;
  };
  error: null | {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};
```

Rules:

- Route handlers validate input with `@kclub/validation`.
- Route handlers call app-owned server services.
- Services use `@kclub/domain` policies before mutating state.
- Services return DTOs from `@kclub/contracts`.
- Admin-app consumes admin DTOs only through product-core admin API.

## 8. Service Layer Pattern

Server services live in product-core because they own runtime dependencies.

```text
apps/product-core/src/server/services/
  auth-service.ts
  user-service.ts
  card-service.ts
  business-service.ts
  introduction-service.ts
  subscription-service.ts
  stripe-service.ts
  audit-service.ts
  admin-service.ts
```

Service method flow:

1. Load current actor/session.
2. Validate permissions with `@kclub/domain`.
3. Validate payload with `@kclub/validation`.
4. Run DB transaction if state changes.
5. Call Stripe/email only from app server code.
6. Write audit log for state-changing admin or billing actions.
7. Map DB rows to `@kclub/contracts` DTOs.

Do not put DB-writing services in shared packages.

## 9. Authentication Architecture

### 9.1 Member

- Supabase phone OTP.
- Public sign-up and sign-in routes are separate UX states.
- App user row is created on successful sign-up.
- Onboarding gate protects member routes until required fields are complete.

### 9.2 Staff

- Staff table is separate from member users.
- Staff sign-in requires an OWNER-approved phone and password.
- Admin session is an httpOnly secure cookie.
- Staff routes require a valid staff session and server-side permission checks.
- Staff permission checks happen in product-core admin APIs and admin-app route guards.

## 10. Deployment

Deployables:

| App                 | Platform       | Domain                | Notes                                   |
| ------------------- | -------------- | --------------------- | --------------------------------------- |
| `apps/product-core` | Vercel         | `www.kylyvnyk.club`   | Public/member app, APIs, webhooks, cron |
| `apps/admin-app`    | Vercel         | `admin.kylyvnyk.club` | Staff dashboard                         |
| Supabase PostgreSQL | Supabase Cloud | N/A                   | Primary database                        |
| Supabase Auth       | Supabase Cloud | N/A                   | Member phone OTP                        |
| Stripe              | Stripe Cloud   | N/A                   | Billing                                 |

Deployment rules:

- Product-core and admin-app may deploy separately.
- CI must build/test affected shared packages first.
- If a shared contract changes, both apps must typecheck before merge.
- Product-core API changes that affect admin-app must be merged with admin-app client/UI updates in the same PR.
- Production migrations must be applied before app code that depends on them.

## 11. CI Pipeline

Minimum CI jobs:

1. Install with Bun.
2. Check lockfile consistency.
3. Typecheck affected packages/apps through Turbo.
4. Lint affected packages/apps.
5. Run unit and contract tests.
6. Build affected apps.
7. Run E2E smoke for critical flows on staging/preview.

Required commands:

```bash
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run test
bun run test:contracts
bun run build
```

Suggested E2E smoke:

- Member sign-up by phone OTP mock.
- Onboarding completion and card issuance.
- VIP checkout return/webhook simulation.
- Business submission and admin approval.
- Business placement webhook publishes directory listing.
- Admin featured toggle respects max 3.
- Staff without an approved phone and password cannot enter dashboard.

## 12. Local Development

Setup:

```bash
bun install
bun run dev
```

Expected ports:

- Product-core: `http://localhost:3000`
- Admin-app: `http://localhost:3001`

Scoped commands:

```bash
bun --filter @kclub/product-core dev
bun --filter @kclub/admin-app dev
bun --filter @kclub/contracts test
```

Local env:

- Each app has its own `.env.local`.
- Shared env schema helpers live in `@kclub/config`.
- Secrets are never placed in packages.
- Admin-app needs product-core API base URL for local proxying.

## 13. Testing Strategy

### 13.1 Unit Tests

Highest priority:

- `@kclub/domain` state machines.
- `@kclub/validation` schemas.
- Permission matrix.
- DTO mappers.
- Stripe webhook handlers with mocked Stripe events.

### 13.2 Contract Tests

Contract tests must assert:

- Error codes are stable.
- DTO enum values match app expectations.
- Admin API route contracts used by admin-app still exist.
- Public DTOs do not include sensitive admin-only fields.

### 13.3 Integration Tests

Product-core integration tests cover:

- Auth callback/session shape.
- Onboarding card issuance transaction.
- Business submit/approve/publish lifecycle.
- Featured business limits under concurrent updates.
- Subscription expiration hides businesses.

### 13.4 E2E Tests

E2E tests cover user-facing critical paths:

- Public home and directory render.
- Member registration and dashboard access.
- VIP upgrade flow with mocked Stripe return.
- Business submission.
- Staff review and featured toggle.
- Public directory visibility after publish.

## 14. Security and Privacy

- Admin routes are noindexed.
- Public card verification returns PII-safe DTO only.
- Staff permissions are enforced server-side in product-core.
- Admin-app UI hiding is not a security boundary.
- Stripe webhooks require signature verification.
- Admin JWT secret and Supabase service role key are server-only.
- Audit logs record actor, action, entity, before/after where appropriate.

## 15. Migration From Separate-Repo Blueprint

Replace the old split-repo assumptions:

| Old assumption                 | New decision                           |
| ------------------------------ | -------------------------------------- |
| `kclub-product-core` repo      | `apps/product-core` workspace          |
| `kclub-admin-app` repo         | `apps/admin-app` workspace             |
| Duplicated types/constants     | `packages/contracts`                   |
| Duplicated validation          | `packages/validation`                  |
| Duplicated business policies   | `packages/domain`                      |
| Shared UI by copy/paste        | `packages/ui`                          |
| Separate lockfiles             | One root `bun.lock`                    |
| Manual cross-repo coordination | One PR with affected apps and packages |

Do not publish internal shared packages to npm for MVP. Workspace packages are private and consumed through workspace references.

## 16. Initial Scaffold Plan

1. Create root Bun/Turbo workspace.
2. Add `apps/product-core` and `apps/admin-app` as Next.js apps.
3. Add package skeletons for contracts, validation, domain, database, ui, config, and test-utils.
4. Wire TypeScript path/package references.
5. Add shared lint/typecheck/build tasks.
6. Define contracts and domain policies before route implementation.
7. Add database migrations and generated types.
8. Implement product-core API/services.
9. Implement admin-app against admin API contracts.
10. Add contract and E2E gates before production deployment.

## 17. Acceptance Criteria

The blueprint is implemented correctly when:

- `bun install --frozen-lockfile` succeeds from repo root.
- `bun run typecheck`, `bun run lint`, `bun run test`, and `bun run build` pass.
- Shared package changes trigger affected app checks through Turbo.
- Product-core and admin-app import DTOs, errors, permissions, and schemas from shared packages.
- No app duplicates shared contract constants.
- Admin-app does not write directly to the product database.
- Product-core owns all Stripe webhook and cron logic.
- CI blocks incompatible contract changes before merge.

## 18. Open Implementation Decisions

Defaults to use unless changed before scaffolding:

| Topic                       | Default                                             |
| --------------------------- | --------------------------------------------------- |
| Package manager             | Bun                                                 |
| Task runner                 | Turborepo                                           |
| Production hosting          | Vercel for both apps                                |
| Runtime DB                  | Supabase PostgreSQL                                 |
| Member auth                 | Supabase phone OTP                                  |
| Staff auth                  | OWNER-approved phone + password + app-owned session |
| Internal package publishing | Private workspace packages only                     |
| Shared server services      | No; keep side-effectful services in product-core    |
