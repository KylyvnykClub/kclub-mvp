# ADR 0005: Staff Auth — Password + Mandatory TOTP

## Status

Accepted (updated 2026-07-25: TOTP enforcement enabled)

## Context

Staff users access operational and sensitive member, billing, business, and audit data. Password-only authentication is insufficient for admin panel security — a compromised password gives full access. TOTP (Time-based One-Time Password) adds a second factor that requires physical device possession.

## Decision

Staff authentication uses a two-step flow:

1. **Password verification** — OWNER-approved phone + password (argon2id hashing)
2. **TOTP verification** — mandatory 6-digit TOTP code from an authenticator app

On first sign-in after password registration, staff are prompted to set up TOTP (the API returns `TOTP_SETUP_REQUIRED` state with an `otpauth://` URI for QR scanning). Subsequent sign-ins return `TOTP_REQUIRED` until the code is verified.

TOTP secrets are encrypted at rest with AES-256-GCM (`TOTP_ENCRYPTION_KEY`). Eight backup codes are generated during setup, stored as SHA-256 hashes, and consumed on use.

The bootstrap owner (env-var based) bypasses TOTP to allow initial system access.

Admin sessions remain app-owned, HMAC-SHA256 signed, httpOnly, sameSite=strict cookies with an 8-hour TTL. Product-core remains the enforcement point for staff session validation and RBAC permission checks.

## Consequences

- Staff auth now requires both password and TOTP for DB-backed staff
- TOTP secrets are encrypted, not stored in plaintext
- Backup codes provide account recovery without admin intervention
- Legacy scrypt password hashes are transparently rehashed to argon2 on login
- Admin-app must handle the multi-step auth flow (password → TOTP setup/verify → session)

## Alternatives Considered

- Phone OTP plus TOTP for staff — rejected: SMS is not a reliable second factor
- Password-only (previous implementation) — rejected: insufficient for admin access
- WebAuthn/FIDO2 — deferred: higher implementation complexity, TOTP is sufficient for MVP
