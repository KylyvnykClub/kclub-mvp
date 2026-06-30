# admin-app Agent Guide

This app owns staff UX, staff auth shell, and the admin proxy/BFF boundary. It does not own product business logic.

## Required Context

- `docs/SPEC.md` sections 5, 6, 7 (admin routes), 10
- `docs/BLUEPRINT.md`
- `docs/agents/auth.md`
- `docs/agents/rbac.md`
- `docs/agents/api.md`
- root `AGENTS.md`

## Scope

- Staff authentication: phone OTP + TOTP 2FA
- Staff session management: httpOnly secure sameSite=strict cookie, 8-hour TTL
- Admin dashboard UI: metrics, user search, card management, subscription management, moderation, introductions, catalog, audit log
- Proxy/BFF boundary: forwards admin actions to product-core admin APIs

## Boundary Rules

- This app must not write directly to product database tables.
- All product data mutations go through product-core admin API calls.
- Business logic, domain policies, and state machines live in product-core and shared packages — not here.
- TOTP verification and staff JWT validation must happen server-side before any admin action.
- This app must not expose product-core internals to the browser.

## Auth Rules

- Staff identities are separate from member identities.
- Auth flow: phone OTP → TOTP verification → admin session cookie issued.
- Staff without verified TOTP land only on 2FA setup/required screen.
- Session TTL is 8 hours; no silent renewal.
- All admin routes must be noindexed and private.

## Permission Rules

- Enforce RBAC at the product-core admin API level, not only in UI.
- UI visibility restrictions are not a security boundary — they are UX only.
- SUPPORT role is read-only; all write actions must be blocked server-side.
- MODERATOR cannot perform user/card/subscription write operations.
- Only OWNER can manage staff roles and Stripe Price IDs.

## admin-app Handoff

Include:

- staff UI surfaces changed
- auth or session behavior changed
- admin API calls added or modified
- permission checks touched
- noindex and route privacy verified
- tests run
