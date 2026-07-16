# Step P3.2 - Member Auth And Onboarding API

## Context To Read First

- `docs/SPEC.md` sections 6, 7.1, 10.1
- `docs/BLUEPRINT.md` sections 9.1, 5.1
- P3.1 handoff

## Goal

Implement product-core member authentication API surfaces and onboarding completion behavior, including automatic card issuance trigger through service logic.

## Non-Goals

- Do not build member UI.
- Do not implement Stripe.
- Do not implement staff auth.

## Implementation Instructions

1. Implement member auth route handlers:
   - `POST /api/v1/auth/sign-up` and `POST /api/v1/auth/sign-up/verify`
   - `POST /api/v1/auth/sign-in`
   - `POST /api/v1/auth/password-recovery` and `POST /api/v1/auth/password-recovery/verify`
   - `POST /api/v1/auth/logout`
2. Preserve distinct sign-up/sign-in semantics in service logic where intent is provided by UI/API.
3. Implement `GET /api/v1/me`, `PATCH /api/v1/me`, and `POST /api/v1/me/complete-onboarding`.
4. Validate inputs with `@kclub/validation`.
5. Use `@kclub/domain` for onboarding completion and capability decisions where applicable.
6. On onboarding completion:
   - save display name, locale preference, terms timestamp
   - issue exactly one active card if no active card exists
   - return updated member DTO
7. Ensure blocked users cannot authenticate into member APIs.

## Interfaces Or Contracts Touched

- Member auth API.
- Member profile DTOs.
- Onboarding validation.
- Card issuance service interface.

## Required Tests

- Unit tests for auth intent decisions.
- Integration tests for onboarding completion and card issuance transaction.
- Tests for blocked user denial.
- Contract tests for `/me` DTO.
- `bun run format`
- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run test:contracts`
- `bun run build`

## Acceptance Criteria

- Member auth endpoints use the shared API envelope.
- Onboarding creates the expected card state.
- Sign-in/sign-up intent errors are clear and tested.
- No UI code is required for API tests.

## Regression Notes

Do not let onboarding happen implicitly during generic session loading. It must occur only through explicit onboarding completion.

## Handoff Summary Format

```markdown
## P3.2 Handoff

- Auth endpoints:
- Onboarding behavior:
- Tests:
- Open risks:
```
