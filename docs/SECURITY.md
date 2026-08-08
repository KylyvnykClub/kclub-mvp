# Security And Privacy

This document captures the security baseline for KCLUB MVP v4.

## Identity Boundaries

- Member identities and staff identities are separate.
- One person may hold both identities, but never through a shared auth session.
- Member auth uses verified phone numbers plus passwords; SMS OTP is limited to registration and password recovery.
- Staff auth uses OWNER-approved phone numbers plus staff passwords.

## Authorization Rules

- Product-core is the enforcement point for product and admin API permissions.
- Admin-app UI hiding is not a security boundary.
- SUPPORT is read-only.
- OWNER-only capabilities must be enforced server-side.

## Session Rules

- Staff sessions must use secure, httpOnly cookies.
- `sameSite=strict` is the default for admin session cookies unless a real cross-site requirement exists.
- Staff without an approved active phone and valid password must be blocked from protected routes.
- Blocked member accounts must not gain member API access.

## Data Protection

- Public card verification DTOs must be PII-safe and must not expose member display names.
- Public business DTOs must not leak admin-only or internal-note fields.
- Logs must not include OTPs, passwords, password hashes, full tokens, Stripe secrets, or service-role keys.
- Staff password hashes must remain server-only.

## Stripe And Cron

- Stripe webhook endpoint must verify signatures.
- Webhook processing must be idempotent.
- Cron routes must require a server-only secret.
- Checkout creation must not change billing or publication state before verified webhook processing.

## Secret Handling

- Secrets live only in local env files or platform secret stores.
- Never commit secrets to the repo.
- Rotate leaked secrets immediately and document the incident.

## Implemented Security Controls (P7.2)

### Member Onboarding Guard

- `POST /api/v1/businesses`, `PATCH /api/v1/businesses/[id]`, and `POST /api/v1/introductions` call `assertMemberOnboardingComplete()` (member-service.ts) immediately after the member lookup.
- Non-onboarded members receive 403 `PERMISSION_DENIED` with message "Onboarding must be completed before this action".
- Read routes (`GET /me`, `GET /businesses`, `GET /introductions`, `POST /me/complete-onboarding`) are intentionally unguarded to allow onboarding flow to proceed.

### Webhook Security

- `POST /api/stripe/webhook` requires `STRIPE_WEBHOOK_SECRET` env var (fail closed — 500 if missing).
- Each request must include a valid `stripe-signature` header verified by `stripe.webhooks.constructEvent()`.
- Events with invalid / missing signatures return 400 with no state change.
- Duplicate `event_id` values are detected via `stripe_webhook_events` unique constraint; duplicates return 200 with `duplicate: true` and no state re-application.
- Event IDs are recorded before processing; processing errors are captured in `handler_status` / `error_message`.

### Cron Security

- `POST /api/cron/daily-maintenance` requires `CRON_SECRET` env var (fail closed — 500 if missing).
- Requests must include `Authorization: Bearer <CRON_SECRET>`; missing/wrong secret returns 401.
- All maintenance operations are idempotent (UPDATE/WHERE based, not INSERT).
- Structured count response includes `cardsExpired`, `subscriptionsExpired`, `businessesHidden`, `webhookEventsCleaned`.

### E2E Test Route Security

- All `/api/v1/test/*` routes (`seed`, `teardown`, `mock-supabase`) require `E2E_TEST_SECRET` env var.
- Without the env var set, routes return 404 (masquerading as not-found).
- With the env var set, `x-e2e-secret` header must match; non-matching returns 401.

## Minimum Security Tests

- Unauthorized webhook request rejection.
- Unauthorized cron request rejection.
- Permission matrix tests for admin mutations.
- Public DTO privacy boundary tests.
- Staff password sign-in and permission gating tests.
- Webhook guard tests (missing secret, missing signature, invalid signature).
- Cron guard tests (missing secret, missing auth, wrong auth, authorized execution).
- E2E test route guard tests (missing secret, missing header, wrong header).
- Public DTO runtime PII safety checks (card verification, business list, business detail).

## Launch Blockers

The following are launch blockers (all resolved in P7.2):

- ~~staff can access dashboard without staff auth~~ — Resolved: staff sessions and admin API permissions are enforced server-side.
- ~~public DTO leaks private data~~ — Resolved: Type-level + runtime tests verify public DTOs exclude PII.
- ~~admin mutations succeed without role checks~~ — Resolved: All 43 admin routes guarded with `adminGuard()` and correct `STAFF_PERMISSIONS`.
- ~~unsigned Stripe webhook is accepted~~ — Resolved: Stripe signature verification via `stripe.webhooks.constructEvent()`.
- ~~cron can be triggered without auth~~ — Resolved: `Authorization: Bearer <CRON_SECRET>` required.

## Residual Risks (P7.2)

| Risk                                  | Description                                                                                                                                        | Owner               | Status                                                                                        |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| Onboarding not enforced at API level  | Member API routes didn't check `isOnboardingComplete()`. Page layout enforces for `/m/*` routes, but programmatic API access could bypass.         | Product engineering | Resolved — `assertMemberOnboardingComplete()` added to business and introduction write routes |
| Stripe event handling is P7.2-minimal | Only `checkout.session.completed` is processed. `customer.subscription.*` and `invoice.payment_failed` events are acknowledged but not acted upon. | Product engineering | Accepted — P7.2 MVP scope                                                                     |
| Billing lifecycle delay               | Subscription expiration is handled by daily cron, not real-time Stripe webhooks. Delay between Stripe marking past_due and cron expiring.          | Product engineering | Accepted — cron runs daily                                                                    |
| Live secrets in `.env` files          | `.env` and `.env.local` contain live Supabase service role key and Stripe keys tracked in git.                                                     | DevOps              | Open — must rotate and add to .gitignore before production                                    |
