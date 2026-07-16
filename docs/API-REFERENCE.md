# API Reference

This is the compact API reference for launch-readiness. The full product rules remain in `SPEC.md`.

## Member And Public API

Base path: `/api/v1`

### Auth

- `POST /auth/sign-up`
- `POST /auth/sign-up/verify`
- `POST /auth/sign-in`
- `POST /auth/password-recovery`
- `POST /auth/password-recovery/verify`
- `POST /auth/logout`

### Member Profile

- `GET /me`
- `PATCH /me`
- `POST /me/complete-onboarding`

### Cards

- `GET /cards`
- `GET /cards/verify/{cardNumber}` public

### Businesses

- `GET /businesses`
- `POST /businesses`
- `GET /businesses/{id}`
- `PATCH /businesses/{id}`
- `POST /businesses/{id}/checkout-placement`

### Introductions

- `GET /introductions`
- `POST /introductions`
- `POST /introductions/{id}/cancel`

### Subscriptions (member)

- `GET /subscriptions` — list own VIP subscriptions
- `GET /subscriptions/{id}` — subscription detail (owner-gated)
- `POST /subscriptions/{id}/cancel` — self-cancel at period end

### Stripe

- `POST /checkout/vip` — start VIP checkout
- `POST /businesses/{id}/checkout-placement` — start placement checkout

## Admin API

Base path: `/api/admin/v1`

### Users

- `GET /users`
- `GET /users/{id}`
- `GET /users/{id}/invoices` — latest paid VIP invoice receipts from Stripe
- `POST /users/{id}/block`
- `POST /users/{id}/unblock`

### Cards

- `GET /cards`
- `POST /cards`
- `POST /cards/{id}/revoke`

### Businesses

- `GET /businesses`
- `GET /businesses/{id}`
- `POST /businesses/{id}/approve`
- `POST /businesses/{id}/reject`
- `POST /businesses/{id}/hide`
- `PATCH /businesses/{id}/featured`

### Introductions

- `GET /introductions`
- `GET /introductions/{id}`
- `POST /introductions/{id}/approve`
- `POST /introductions/{id}/reject`
- `POST /introductions/{id}/complete`

### Taxonomy

- `GET/POST/PATCH /categories`
- `GET/POST/PATCH /countries`
- `GET/POST/PATCH /cities`

### Subscriptions And Config

- `GET /subscriptions`
- `GET /subscriptions/{id}`
- `POST /subscriptions/{id}/cancel`
- `GET/PATCH /stripe-prices`
- `GET/PATCH /admin-config/{key}`
- `GET/POST/PATCH/DELETE /staff`
- `GET /audit`
- `POST /webhooks/{eventId}/replay` — **not yet implemented**; use Stripe Dashboard resend

### Cron

- `POST /api/cron/daily-maintenance` — protected by `CRON_SECRET` env var

## Shared Response Envelope

All APIs must use the shared response envelope from `packages/contracts`.

## Source Of Truth

If this file and `SPEC.md` disagree, `SPEC.md` wins and this file must be updated.
