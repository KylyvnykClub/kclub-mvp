# ADR 0005: Staff Auth Uses Approved Phones And Passwords

## Status

Accepted

## Context

Staff users can access operational and sensitive member, billing, business, and audit data. The MVP staff auth model now avoids SMS and TOTP verification for the admin panel. Access must still be explicitly controlled by platform ownership.

## Decision

Staff authentication requires an OWNER-approved phone number plus a staff password. OWNER users manage which staff phones are active and may reset a staff password. Unapproved or inactive phones cannot register a password or sign in.

Admin sessions remain app-owned, signed, httpOnly, sameSite=strict cookies with an 8-hour TTL. Product-core remains the enforcement point for staff session validation and RBAC permission checks.

## Consequences

- Staff auth differs from member auth.
- Staff identities remain separate from member identities.
- Password hashes remain server-only.
- OWNER-managed staff access must be audited.
- Route guards and API permission checks must both enforce staff access.

## Alternatives Considered

- Phone OTP plus TOTP for staff.
- Shared member/staff account sessions.
- Invite-token password setup for v1.
