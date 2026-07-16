# Environment Variables

This document defines the environment contract for KCLUB MVP v4. Never commit real secrets. Each app uses its own `.env.local` in development and platform-managed secrets in staging/production.

## Rules

- Validate env at startup.
- Fail fast for missing required secrets.
- Keep server-only secrets out of public bundles.
- Prefix client-exposed variables with `NEXT_PUBLIC_` only when they are safe.

## Product-Core

| Variable                             | Required            | Environment | Purpose                                                                                                                        |
| ------------------------------------ | ------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_APP_URL`                | Yes                 | all         | Public product-core base URL                                                                                                   |
| `NEXT_PUBLIC_SUPABASE_URL`           | Yes                 | all         | Supabase project URL                                                                                                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Yes                 | all         | Public Supabase client key                                                                                                     |
| `SUPABASE_SERVICE_ROLE_KEY`          | Yes                 | server only | Service-role access for product-core server logic                                                                              |
| `SUPABASE_JWT_SECRET`                | Optional            | server only | Needed only if server verifies tokens directly                                                                                 |
| `STRIPE_SECRET_KEY`                  | Yes                 | server only | Stripe server SDK                                                                                                              |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes                 | all         | Stripe client usage if checkout helpers require it                                                                             |
| `STRIPE_WEBHOOK_SECRET`              | Yes                 | server only | Stripe webhook signature verification                                                                                          |
| `CRON_SECRET`                        | Yes                 | server only | Protects cron route                                                                                                            |
| `ADMIN_APP_URL`                      | Yes                 | all         | Admin app base URL for links and redirects                                                                                     |
| `EMAIL_PROVIDER_API_KEY`             | Optional/likely yes | server only | Transactional email provider key                                                                                               |
| `EMAIL_FROM_ADDRESS`                 | Optional/likely yes | server only | Sender for product emails                                                                                                      |
| `ADMIN_BOOTSTRAP_OWNER_PHONE`        | Yes at bootstrap    | server only | First OWNER staff phone until OWNER can manage staff accounts                                                                  |
| `ADMIN_BOOTSTRAP_OWNER_PASSWORD`     | Yes at bootstrap    | server only | Initial OWNER password used by seed when the bootstrap OWNER has no password yet                                               |
| `AUTH_DEV_PHONE_BYPASS_ENABLED`      | Dev only            | server only | Enables member phone OTP bypass without SMS/Twilio                                                                             |
| `AUTH_DEV_PHONE_BYPASS_SECRET`       | Dev only            | server only | Required acknowledgment when bypass is enabled locally; if set to 4–8 digits, also used as the dev OTP code (default `000000`) |
| `LOG_LEVEL`                          | Optional            | all         | Logging verbosity                                                                                                              |

## Admin-App

| Variable                        | Required | Environment | Purpose                                                            |
| ------------------------------- | -------- | ----------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_ADMIN_APP_URL`     | Yes      | all         | Admin app base URL                                                 |
| `PRODUCT_CORE_API_BASE_URL`     | Yes      | server only | Product-core base URL for staff auth validation and admin proxy    |
| `ADMIN_JWT_SECRET`              | Yes      | server only | Staff session signing secret shared with product-core token issuer |
| `NEXT_PUBLIC_SUPABASE_URL`      | Optional | all         | Needed only if admin-app uses Supabase client directly             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | all         | Same note as above                                                 |
| `LOG_LEVEL`                     | Optional | all         | Logging verbosity                                                  |

## Shared Operational Variables

| Variable               | Required                 | Environment | Purpose                                |
| ---------------------- | ------------------------ | ----------- | -------------------------------------- |
| `NODE_ENV`             | Yes                      | all         | Runtime mode                           |
| `APP_ENV`              | Yes                      | all         | `development`, `staging`, `production` |
| `RATE_LIMIT_REDIS_URL` | Optional but recommended | server only | Abuse/rate-limit backend if used       |

## Ownership

- Product engineering owns env schema.
- DevOps/platform owner owns staging and production secret provisioning.
- No feature is considered launch-ready until required env is documented here and used in code.
