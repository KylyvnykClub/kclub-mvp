# Auth Agent Guide

Use this guide for member auth, staff auth, onboarding gates, sessions, and route protection.

## Required Context

- `docs/SPEC.md` sections 5, 6, and 7
- `docs/SECURITY.md`
- `docs/BLUEPRINT.md` section 9
- root `AGENTS.md`

## Member Auth Rules

- Member auth uses phone OTP.
- Sign-up and sign-in are separate product intents.
- Sign-up creates a member only when the phone is new.
- Sign-in authenticates an existing member.
- Existing-phone sign-up must point users to sign-in.
- Unknown-phone sign-in must point users to sign-up.
- Onboarding completion is explicit and must not happen during generic session loading.

## Staff Auth Rules

- Staff identities are separate from member identities.
- Staff auth requires an OWNER-approved phone number plus a staff password.
- Staff without an approved active phone cannot register a password or sign in.
- Staff sessions must use secure, httpOnly cookies.
- SUPPORT is read-only.

## Route Guard Rules

- Incomplete members are redirected to onboarding from protected member routes.
- Blocked members cannot access member APIs.
- Admin route protection must exist in admin-app and product-core admin API enforcement.
- UI hiding is not a security boundary.

## Auth Test Rules

Required for auth changes:

- intent tests for sign-up vs sign-in
- onboarding guard tests
- blocked user tests
- staff password sign-in and permission-gating tests
- permission tests for admin API access

## Auth Handoff

Include:

- auth surfaces changed
- session or cookie behavior
- route guards touched
- tests run
- security risks
