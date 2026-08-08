# Environment Variables

This document defines the environment contract for KCLUB MVP v4. Never commit real secrets. Each app uses its own `.env.local` in development and platform-managed secrets in staging/production.

## Rules

- Validate env at startup. Product-core enforces the required production set in `apps/product-core/src/instrumentation.ts` (via `src/server/env-validation.ts`); a missing or malformed required variable fails the deployment/boot instead of the first request.
- Fail fast for missing required secrets.
- Keep server-only secrets out of public bundles.
- Prefix client-exposed variables with `NEXT_PUBLIC_` only when they are safe.

## Startup Validation (Product-Core)

Enforced only on real production deploys (`VERCEL_ENV=production`, or `APP_ENV=production` to force it). Preview builds and the e2e server (which runs with `NODE_ENV=production` but no `VERCEL_ENV`) are intentionally exempt:

- **Required (must be present, URLs must be valid):** `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `CRON_SECRET`, `TOTP_ENCRYPTION_KEY`, `ADMIN_JWT_SECRET`.
- **Forbidden in production (boot fails if set/enabled):** `AUTH_DEV_PHONE_BYPASS_ENABLED`, `AUTH_DEV_2FA_BYPASS_ENABLED`, `E2E_TEST_SECRET`, `ALLOW_SEED`, `CONFIRM_SEED`.

## Product-Core

| Variable                                  | Required         | Environment | Purpose                                                                                    |
| ----------------------------------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_APP_URL`                     | Yes              | all         | Public product-core base URL                                                               |
| `NEXT_PUBLIC_SITE_URL`                    | Optional         | all         | Canonical public site URL for SEO/sitemap (defaults to `https://kylyvnyk.club`)            |
| `NEXT_PUBLIC_SUPABASE_URL`                | Yes              | all         | Supabase project URL                                                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`           | Yes              | all         | Public (anon) Supabase client key                                                          |
| `SUPABASE_SERVICE_ROLE_KEY`               | Yes              | server only | Service-role access for product-core server logic                                          |
| `STRIPE_SECRET_KEY`                       | Yes              | server only | Stripe server SDK                                                                          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`      | Yes              | all         | Stripe client key for checkout helpers                                                     |
| `STRIPE_WEBHOOK_SECRET`                   | Yes              | server only | Stripe webhook signature verification                                                      |
| `STRIPE_PRICE_VIP_MEMBERSHIP_MONTHLY`     | Optional         | server only | Local fallback price ID; checkout reads `admin_config` first                               |
| `STRIPE_PRICE_BUSINESS_PLACEMENT_MONTHLY` | Optional         | server only | Local fallback price ID; checkout reads `admin_config` first                               |
| `STRIPE_PRICE_VIP_ANNUAL`                 | Optional         | server only | Legacy alias honored by the checkout price fallback                                        |
| `STRIPE_PRICE_BUSINESS_ANNUAL`            | Optional         | server only | Legacy alias honored by the checkout price fallback                                        |
| `STRIPE_PORTAL_CONFIGURATION_ID`          | Optional         | server only | Stripe Customer Portal configuration ID                                                    |
| `CRON_SECRET`                             | Yes              | server only | Bearer token protecting `/api/cron/daily-maintenance` (Vercel Cron attaches it)            |
| `DATABASE_URL`                            | Yes              | server only | Primary (pooled) PostgreSQL connection string for the Drizzle runtime                      |
| `DATABASE_URL_DIRECT`                     | Optional         | server only | Direct (non-pooled) connection string for migrations, seeding, and maintenance tasks       |
| `TEST_DATABASE_URL`                       | Test only        | server only | Disposable DB for `pnpm test:db` (name must contain test, ci, or scratch)                  |
| `ADMIN_APP_URL`                           | Yes              | all         | Admin app base URL for links and redirects                                                 |
| `ADMIN_JWT_SECRET`                        | Yes              | server only | Signing secret for staff session JWTs issued/validated by product-core                     |
| `TOTP_ENCRYPTION_KEY`                     | Yes              | server only | AES-256-GCM key encrypting stored staff TOTP secrets                                       |
| `ADMIN_BOOTSTRAP_OWNER_PHONE`             | Yes at bootstrap | server only | First OWNER staff phone until OWNER can manage staff accounts                              |
| `ADMIN_BOOTSTRAP_OWNER_PASSWORD`          | Yes at bootstrap | server only | Initial OWNER password used by seed when the bootstrap OWNER has no password yet           |
| `STAFF_AUTH_RATE_LIMIT_REQUIRED`          | Optional         | server only | Forces the rate-limit backend to be required (auto-on in production)                       |
| `AUTH_DEV_PHONE_BYPASS_ENABLED`           | Dev only         | server only | Enables member phone OTP bypass without SMS. Ignored in production                         |
| `AUTH_DEV_PHONE_BYPASS_SECRET`            | Dev only         | server only | Required acknowledgment when phone bypass is enabled locally; may also provide the dev OTP |
| `AUTH_DEV_2FA_BYPASS_ENABLED`             | Dev only         | server only | Enables staff 2FA bypass locally. Forbidden in production                                  |
| `E2E_TEST_SECRET`                         | E2E only         | server only | Guards `/api/v1/test/*` routes used by Playwright. Forbidden in production                 |
| `ALLOW_SEED` / `CONFIRM_SEED`             | Seed only        | server only | Gate destructive seed operations. Forbidden in production                                  |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`            | Optional         | all         | Plausible analytics domain (analytics disabled when unset)                                 |
| `LOG_LEVEL`                               | Optional         | all         | Logging verbosity                                                                          |
| `UPSTASH_REDIS_REST_URL`                  | Optional         | server only | URL for the shared rate-limit storage backend                                              |
| `UPSTASH_REDIS_REST_TOKEN`                | Optional         | server only | Token for the shared rate-limit storage backend                                            |

> Not currently read by application code (documented previously but unused): `SUPABASE_JWT_SECRET`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM_ADDRESS`. Add them back here only when a code path consumes them.

## Admin-App

The admin console is a thin shell that proxies to product-core; staff auth, TOTP, and JWT signing all live in product-core. Admin-app itself reads only:

| Variable                     | Required | Environment | Purpose                                                         |
| ---------------------------- | -------- | ----------- | --------------------------------------------------------------- |
| `PRODUCT_CORE_API_BASE_URL`  | Yes      | server only | Product-core base URL for staff auth validation and admin proxy |
| `PRODUCT_CORE_ADMIN_API_URL` | Yes      | server only | Admin-scoped product-core API base for server-to-server calls   |
| `NODE_ENV`                   | Yes      | all         | Runtime mode                                                    |
| `LOG_LEVEL`                  | Optional | all         | Logging verbosity                                               |

## Shared Operational Variables

| Variable               | Required                 | Environment | Purpose                                |
| ---------------------- | ------------------------ | ----------- | -------------------------------------- |
| `NODE_ENV`             | Yes                      | all         | Runtime mode                           |
| `APP_ENV`              | Yes                      | all         | `development`, `staging`, `production` |
| `RATE_LIMIT_REDIS_URL` | Optional but recommended | server only | Abuse/rate-limit backend if used       |

## Local E2E Runtime Notes

- `pnpm --filter @kclub/product-core start:e2e` and `pnpm --filter @kclub/admin-app-legacy start:e2e` load each app's `.env` and `.env.local` before `next start`.
- Keep `E2E_TEST_SECRET` scoped to local and CI test environments only.
- Never enable `/api/v1/test/*` routes in staging or production.

## Ownership

- Product engineering owns env schema.
- DevOps/platform owner owns staging and production secret provisioning.
- No feature is considered launch-ready until required env is documented here and used in code.
