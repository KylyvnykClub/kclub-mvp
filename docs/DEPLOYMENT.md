# Deployment Runbook

This runbook describes how to deploy KCLUB MVP v4 to staging and production.

## Deploy Targets

| App                 | Platform       | Domain                |
| ------------------- | -------------- | --------------------- |
| `apps/product-core` | Vercel         | `www.kylyvnyk.club`   |
| `apps/admin-app`    | Vercel         | `admin.kylyvnyk.club` |
| Database            | Supabase Cloud | managed               |
| Billing             | Stripe         | managed               |

## Preconditions

- CI is green.
- Release checklist is complete.
- Required env vars are configured.
- Database migrations are reviewed.
- Stripe products, prices, and webhook endpoint are prepared.

## Staging Deployment

1. Merge the target branch into the staging branch or create a staging preview deploy.
2. Apply pending database migrations to staging.
3. Verify `product-core` preview URL and `admin-app` preview URL.
4. Run smoke checks:
   - public home
   - member sign-up/sign-in
   - onboarding
   - admin sign-in
   - Stripe checkout start
   - webhook endpoint reachable
5. Record staging validation result in the release notes or handoff.

## Migration Application Checklist

Run this checklist before deploying any release that includes schema migrations.

- [ ] Review pending migrations: `bun --filter @kclub/database db:migrate:status` (or inspect `packages/database/prisma/migrations/`)
- [ ] Confirm migration is backward-compatible (app can run against old schema during the deployment window)
- [ ] If migration is destructive (drops columns, changes types), take a database snapshot before proceeding
- [ ] Apply migrations to **staging**: `DATABASE_URL=<staging-url> bun --filter @kclub/database db:migrate:deploy`
- [ ] Verify staging app starts and key routes respond correctly
- [ ] Apply migrations to **production**: `DATABASE_URL=<production-url> bun --filter @kclub/database db:migrate:deploy`
- [ ] Verify production app starts and smoke checks pass

## Stripe Dashboard Setup Checklist

One-time configuration required before first production deploy. Use Stripe test mode for staging and live mode for production.

### Products and Prices

- [ ] Create product **"VIP Membership"** → add price → copy price ID to `STRIPE_PRICE_VIP`
- [ ] Create product **"Business Directory Placement"** → add price → copy price ID to `STRIPE_PRICE_BUSINESS`
- [ ] Configure **Customer Portal** (allowed products, cancellation policy) → copy portal configuration ID to `STRIPE_PORTAL_CONFIGURATION_ID`

### Webhook Endpoint

- [ ] Create webhook endpoint in Stripe dashboard pointing to `https://www.kylyvnyk.club/api/stripe/webhook`
- [ ] Subscribe to these events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- [ ] Copy signing secret to `STRIPE_WEBHOOK_SECRET`
- [ ] Repeat for **staging** using the staging preview URL and test-mode Stripe keys; store as a separate secret

## Production Deployment

1. Freeze non-essential merges.
2. Confirm current rollback point.
3. Apply database migrations first if backward compatible.
4. Deploy `apps/product-core`.
5. Deploy `apps/admin-app`.
6. Verify domains and TLS.
7. Re-run production smoke checks:
   - home and directory
   - card verification
   - member auth
   - admin auth
   - Stripe checkout start
   - webhook signature verification path
   - cron route auth

## Post-Deploy Verification

### product-core (`www.kylyvnyk.club`)

- [ ] Public home loads and localized routes work
- [ ] Member sign-up flow starts (phone entry page renders)
- [ ] `GET /api/stripe/webhook` returns **400**, not 404 (endpoint exists, rejects non-POST)
- [ ] `GET /api/cron/daily-maintenance` without `Authorization` header returns **401**
- [ ] No launch-blocking errors in logs

### admin-app (`admin.kylyvnyk.club`)

- [ ] Admin login page loads
- [ ] Response headers include `X-Robots-Tag: noindex, nofollow`
- [ ] Staff sign-in redirects correctly after authentication
- [ ] Audit log and moderation routes are accessible to authorized staff
- [ ] No launch-blocking errors in logs

## Rollback

Use rollback if:

- auth is broken for members or staff
- Stripe webhook processing is failing in production
- migrations caused incompatible runtime failures
- public pages leak PII or admin access is exposed

Rollback steps:

1. Disable new release traffic if supported by platform.
2. Roll back Vercel deploys to last known good release.
3. If migration is backward-compatible, keep it and restore app code first.
4. If migration is not backward-compatible, follow the DB rollback plan in `DB-OPERATIONS.md`.
5. Re-run smoke checks after rollback.

## Ownership

- Engineering lead owns deploy decision.
- Platform owner owns secret correctness and domain config.
- Product owner signs off on accepted launch risks.
