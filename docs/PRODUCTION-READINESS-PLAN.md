# KCLUB MVP v4 — Production Readiness Plan

## Document Status

| Field                          | Value                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------ |
| Purpose                        | Fastest safe path from the current repository state to production launch       |
| Launch classification at start | `NOT READY`                                                                    |
| Scope                          | Launch blockers, release evidence, staging, and production provisioning only   |
| Out of scope                   | New product features, visual redesigns, broad refactors, post-MVP improvements |
| Package manager                | `pnpm@9.15.9`                                                                  |
| Runtime                        | Node.js 22                                                                     |

This plan is the operational source of truth for the production-readiness pass. A checked box means the stated evidence exists and has been reviewed; it does not mean that a file or route merely exists.

## Fast-Track Strategy

Run four workstreams in parallel, but merge them into staging in this order:

1. Billing and database integrity.
2. Security and authorization.
3. Build, test, and E2E restoration.
4. Deployment and operations.

Do not deploy production until all `P0` gates are complete. Product polish and non-critical warning cleanup must not delay the critical path.

With two engineers and one platform owner working in parallel, the target is approximately 4–6 focused working days plus the staging observation window. A single engineer should expect a longer schedule.

## Roles

| Owner               | Responsibility                                               |
| ------------------- | ------------------------------------------------------------ |
| Backend engineer    | Stripe, webhook retry, placement lifecycle, migrations, cron |
| Full-stack engineer | RBAC, privacy contract, admin build, E2E                     |
| Platform owner      | Vercel, Supabase, Stripe dashboard, secrets, domains, alerts |
| Product owner       | Privacy decision, accepted risks, final go/no-go approval    |

One person may own several roles, but every gate must still have a named owner.

## Phase 0 — Freeze And Baseline

Target: 1–2 hours.

- [ ] Freeze unrelated feature merges until production sign-off.
- [ ] Preserve or finish the current dirty worktree before creating a release candidate.
- [ ] Create a release branch from the agreed commit.
- [ ] Confirm Node.js 22 and `pnpm@9.15.9` in local, CI, and Vercel environments.
- [ ] Capture the current CI run URL and failing jobs in the release record.
- [ ] Assign owners for Backend, Full-stack, Platform, and Product sign-off.

Baseline commands:

```bash
pnpm install --frozen-lockfile
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run test:contracts
pnpm run build
pnpm run e2e
```

Expected starting state:

- product-core build passes;
- admin-app build fails on lint errors;
- formatting fails;
- unit tests pass with 32 skipped tests;
- release-critical E2E contains `fixme` cases.

Exit gate:

- [ ] Release candidate scope and owners are recorded.
- [ ] No unreviewed feature work is entering the release branch.

## Phase 1 — Billing And Database Integrity (`P0`)

This phase is first because failures can create paid-but-unfulfilled or unpaid-but-published states.

### 1.1 Repair Migration `0009`

Files:

- `packages/database/drizzle/0009_business_review_submission_hold.sql`
- `packages/database/drizzle/meta/_journal.json`
- `packages/database/src/schema.ts`

Actions:

- [ ] Add `0009_business_review_submission_hold` to the Drizzle migration journal using the repository-approved migration workflow.
- [ ] Verify a fresh empty PostgreSQL database reaches the current schema using only committed migrations.
- [ ] Verify upgrade from the latest production/staging schema snapshot.
- [ ] Confirm `business_review_submissions` constraints and indexes exist.
- [ ] Add a migration test that fails when SQL files and journal entries drift.
- [ ] Document forward and rollback behavior. Prefer a forward fix if production has partially applied schema.

Validation:

```bash
pnpm --filter @kclub/database test
pnpm --filter @kclub/database db:migrate:deploy
```

Exit gate:

- [ ] Fresh and upgrade migrations pass against disposable databases.
- [ ] No manual SQL is required outside the documented migration procedure.

### 1.2 Make Webhook Retries Recoverable

File: `apps/product-core/src/server/services/webhook-service.ts`.

Required behavior:

- `PROCESSED` duplicate: acknowledge without reapplying state;
- `FAILED` event: allow a controlled retry;
- event currently being processed: prevent concurrent double application;
- every attempt: record status, timestamps, and a redacted error;
- state mutation and audit event: remain transactionally consistent where required.

Actions:

- [ ] Replace the unconditional unique-violation early return with status-aware event claiming.
- [ ] Add tests for first delivery, concurrent duplicate, processed duplicate, failed delivery, and failed-event retry.
- [ ] Implement an OWNER/ADMIN-protected replay command, or document and test an equally safe operator mechanism.
- [ ] Update `docs/RUNBOOKS.md` so Stripe Dashboard Resend is only claimed to work when the code actually retries `FAILED` events.

Exit gate:

- [ ] A deliberately failed event can be replayed successfully without direct database editing.
- [ ] A processed event cannot apply billing state twice.

### 1.3 Complete Business Placement Lifecycle

Files:

- `apps/product-core/src/server/services/webhook-service.ts`
- `apps/product-core/src/server/services/maintenance-service.ts`
- `apps/product-core/tests/server/webhook-service-placement.test.ts`
- `apps/product-core/tests/server/cron-maintenance.test.ts`

Actions:

- [ ] Handle `customer.subscription.created/updated/deleted` for `BUSINESS_PLACEMENT` subscriptions.
- [ ] Handle `invoice.payment_failed` for placement subscriptions.
- [ ] Preserve approved cancellation access only until `current_period_end`.
- [ ] Hide the business and clear featured flags when placement entitlement expires.
- [ ] Revalidate public directory caches after placement status changes.
- [ ] Write audit events for placement activation, cancellation, expiration, payment failure, and business hiding.
- [ ] Make cron reconcile both VIP and placement subscriptions.
- [ ] Re-enable all placement and cron test suites using Drizzle mocks or a disposable database.

Exit gate:

- [ ] Paid placement becomes active only after a verified webhook.
- [ ] Failed, deleted, or expired placement cannot remain publicly visible beyond the defined grace period.
- [ ] Placement webhook and cron tests have zero skips.

## Phase 2 — Security, Privacy, And RBAC (`P0`)

### 2.1 Remove Production Debug Surface

- [ ] Delete `apps/product-core/src/app/api/debug-prisma/route.ts`.
- [ ] Add a route inventory test that rejects debug-only production routes.
- [ ] Confirm the route is absent from the production build manifest.

Exit gate:

- [ ] `/api/debug-prisma` returns 404 in staging.

### 2.2 Make Staff Sessions Fail Closed

File: `apps/product-core/src/server/staff-auth.ts`.

Actions:

- [ ] Require successful persistence for DB-backed staff sessions.
- [ ] Treat a missing DB session row as invalid.
- [ ] Treat DB validation failure as dependency failure, never as a valid session.
- [ ] Verify deactivation, revocation, expiration, role change, and permission changes invalidate access as designed.
- [ ] Keep any bootstrap-only exception explicit, isolated, and removable after bootstrap.
- [ ] Add tests for DB outage and missing session row.

Exit gate:

- [ ] No DB-backed staff request is authorized when session state cannot be verified.

### 2.3 Add Staff Authentication Rate Limits

- [ ] Rate-limit password registration and sign-in by normalized phone plus client IP.
- [ ] Rate-limit TOTP setup and verification.
- [ ] Add bounded lockout/backoff behavior without revealing whether a staff phone exists.
- [ ] Require the production Redis/rate-limit backend instead of silently disabling protection.
- [ ] Add 429 and recovery-window tests.

Exit gate:

- [ ] Repeated password or TOTP guesses are rejected and observable without logging secrets.

### 2.4 Restore SUPPORT As Strict Read-Only

Files:

- `packages/contracts/src/permissions.ts`
- `packages/domain/src/rbac-policy.ts`
- product-core staff auth and admin guards
- admin-app navigation and route permissions

Actions:

- [ ] Add `SUPPORT` to the shared role contract.
- [ ] Grant only the explicitly approved read permissions.
- [ ] Deny all mutations server-side, including permission overrides that would violate the read-only invariant.
- [ ] Add contract, domain, API, admin navigation, and E2E coverage.

Exit gate:

- [ ] SUPPORT can sign in and perform approved investigation reads.
- [ ] Every mutation returns 403 for SUPPORT.

### 2.5 Resolve Public Card Privacy Contract

Fastest safe decision: remove `displayName` from the public verification DTO and page unless the product owner explicitly approves public name disclosure.

Actions:

- [ ] Record the product decision.
- [ ] Align `PublicCardVerificationDto`, mapper, page, translations, privacy tests, SPEC, and SECURITY documentation.
- [ ] Verify response headers and caching behavior do not retain sensitive responses.
- [ ] Confirm the public response exposes only the approved minimum fields.

Exit gate:

- [ ] Runtime privacy test checks exact response keys, not only TypeScript types.
- [ ] Acceptance documentation no longer contradicts the UI.

## Phase 3 — Build And Test Restoration (`P0`)

### 3.1 Restore Green Quality Gates

- [ ] Fix admin-app unused imports and variables that block lint/build.
- [ ] Fix formatting failures in the release candidate.
- [ ] Run `git diff --check`.
- [ ] Keep unrelated warning cleanup outside the critical path unless it indicates runtime risk.

Exit gate:

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run test:contracts
pnpm run build
```

All commands must exit `0` with no skipped launch-critical suites.

### 3.2 Restore Integration Tests

- [ ] Rewrite Prisma-era cron mocks for Drizzle and remove `describe.skip`.
- [ ] Rewrite placement webhook mocks for Drizzle and remove `describe.skip`.
- [ ] Fix the un-awaited rejection assertion reported by Vitest.
- [ ] Add coverage for webhook retry and placement lifecycle introduced in Phase 1.

Exit gate:

- [ ] Current 32 skipped tests are restored or individually classified and approved by the engineering lead.
- [ ] No billing, cron, security, or permission test is skipped.

### 3.3 Restore Release-Critical E2E

Actions:

- [ ] Rewrite the business submission E2E for `BusinessSubmitWizard` and remove `test.fixme`.
- [ ] Seed a real DB-backed staff user and exercise password → TOTP → dashboard.
- [ ] Stop using the bootstrap-owner TOTP bypass as proof of staff MFA.
- [ ] Cover the complete business path: reserve → review → approval → placement payment → publication → directory.
- [ ] Cover failed webhook replay.
- [ ] Assert Playwright reports zero `fixme`, unexpected skips, and failures.

Exit gate:

```bash
pnpm run e2e
```

- [ ] All 19 current scenarios pass or are replaced by stronger equivalents.
- [ ] CI uploads traces, screenshots, and reports on failure.

## Phase 4 — Deployment Contract And Operations (`P0`)

### 4.1 Synchronize Environment Contracts

- [ ] Create and track `apps/admin-app/.env.example` with placeholders only.
- [ ] Deduplicate `apps/product-core/.env.example`.
- [ ] Reconcile actual `process.env` usage with `docs/ENVIRONMENT.md`.
- [ ] Document `DATABASE_URL`, direct migration URL, TOTP encryption, Upstash, Stripe prices, Supabase, admin API URL, and E2E-only variables accurately.
- [ ] Add startup validation for required production variables.
- [ ] Verify dev/test bypass variables fail closed in production.

Exit gate:

- [ ] A new staging project can be configured without undocumented variables.
- [ ] Missing required production configuration fails during deployment, not on the first user request.

### 4.2 Finalize Vercel Configuration

- [ ] Add the daily maintenance cron schedule to product-core configuration.
- [ ] Remove migration generation from application build commands; deployments must apply reviewed committed migrations, not generate new ones.
- [ ] Confirm correct monorepo Root Directory and install/build commands for both apps.
- [ ] Pin Node.js and pnpm versions.
- [ ] Confirm admin `X-Robots-Tag: noindex, nofollow`.
- [ ] Prefer self-hosted fonts so production builds do not depend on Google Fonts availability.

Exit gate:

- [ ] Clean Vercel preview builds succeed for both apps from a fresh checkout.
- [ ] Cron invocation appears in staging logs and rejects invalid authorization.

### 4.3 Configure Monitoring And Runbooks

- [ ] Configure a real log drain or monitoring provider.
- [ ] Enable alerts for webhook failures, cron failures, auth anomalies, health degradation, and 5xx spikes.
- [ ] Verify logs redact passwords, OTPs, tokens, Stripe signatures, and service-role keys.
- [ ] Assign an on-call destination and escalation owner.
- [ ] Test the failed webhook, failed cron, staff recovery, and rollback runbooks.

Exit gate:

- [ ] Every high-priority alert has been triggered once in staging and received by the assigned owner.

## Phase 5 — Staging Release Candidate

Minimum observation window: one complete validation cycle, including at least one scheduled cron run.

### 5.1 Provision Staging

- [ ] Create isolated staging Vercel projects.
- [ ] Create or confirm an isolated staging Supabase database and Auth configuration.
- [ ] Apply migrations from an empty/known schema.
- [ ] Seed reference countries, cities, categories, membership data, and bootstrap staff.
- [ ] Configure Stripe test-mode products, prices, Customer Portal, and webhook endpoint.
- [ ] Configure SMS delivery for the approved staging test numbers.
- [ ] Configure cron, Upstash, monitoring, domains, and TLS.

### 5.2 Execute Acceptance Matrix

- [ ] Public home, localized routes, directory, business detail.
- [ ] Member sign-up, SMS verification, password sign-in, recovery.
- [ ] Onboarding and card issuance.
- [ ] Public card verification privacy boundary.
- [ ] VIP checkout, webhook activation, cancellation, expiration.
- [ ] Business reserve, moderation, placement, publication, expiration/hiding.
- [ ] Business Introduction submission and moderation.
- [ ] DB-backed staff password and TOTP.
- [ ] SUPPORT read-only enforcement.
- [ ] Audit records for every state-changing staff/billing action.
- [ ] Failed webhook retry and duplicate-event handling.
- [ ] Authorized and unauthorized cron behavior.
- [ ] Health checks, alerts, and logs.

Evidence required:

- CI run URL;
- Vercel preview URLs and commit SHA;
- migration output;
- Playwright report;
- Stripe event IDs used during acceptance;
- screenshots or logs for security/permission gates;
- known-risk register with owner and decision.

Exit gate:

- [ ] Zero open security, privacy, billing, migration, or authorization failures.
- [ ] Zero skipped release-critical tests.
- [ ] Product owner signs the acceptance matrix.
- [ ] Engineering and Platform owners sign rollback readiness.

## Phase 6 — Production Go-Live

### 6.1 Pre-Launch

- [ ] Tag the exact release commit.
- [ ] Freeze production merges.
- [ ] Back up the production database and verify restore access.
- [ ] Rotate any secret that may have existed in local files or repository history.
- [ ] Configure production Supabase, Stripe live mode, Vercel, Upstash, monitoring, domains, and TLS.
- [ ] Remove or disable bootstrap credentials after persistent OWNER access is verified.
- [ ] Confirm rollback deploy and database forward-fix procedure.

### 6.2 Deploy

1. Apply reviewed backward-compatible database migrations.
2. Deploy product-core.
3. Verify health, public routes, member auth, webhook signature rejection, and cron rejection.
4. Deploy admin-app.
5. Verify staff TOTP, permissions, audit, and noindex headers.
6. Enable Stripe live webhook delivery and cron.
7. Run the production smoke suite using designated test accounts.

### 6.3 Post-Launch Observation

- [ ] Watch logs and alerts continuously during the agreed launch window.
- [ ] Confirm at least one real or controlled VIP payment lifecycle.
- [ ] Confirm one controlled business placement lifecycle.
- [ ] Confirm webhook events end in `PROCESSED` and duplicates do not reapply state.
- [ ] Confirm cron completes and reports expected counts.
- [ ] Confirm no elevated auth, permission, DB, or 5xx errors.

Rollback immediately if:

- member or staff authentication is unavailable;
- staff authorization can be bypassed;
- public responses leak unapproved member data;
- Stripe events cannot be processed or recovered;
- paid state and local entitlement diverge;
- migrations cause incompatible runtime errors.

## Final Go/No-Go Checklist

Production launch is `GO` only when every item below is checked:

- [ ] Format, lint, typecheck, tests, contract tests, builds, and E2E are green on the release commit.
- [ ] No launch-critical test is skipped or marked `fixme`.
- [ ] Fresh and upgrade database migrations are verified.
- [ ] Failed Stripe events are recoverable and duplicate processing is safe.
- [ ] VIP and business-placement lifecycles are complete.
- [ ] Debug routes are absent.
- [ ] Staff sessions fail closed and staff auth is rate-limited.
- [ ] SUPPORT is proven read-only or formally removed from the approved MVP scope.
- [ ] Public card verification matches the approved privacy contract.
- [ ] Both Vercel deployments, cron, domains, TLS, and health checks are verified.
- [ ] Production env variables and secrets are complete and rotated.
- [ ] Alerts and runbooks have been exercised in staging.
- [ ] Rollback point and database recovery procedure are confirmed.
- [ ] Engineering, Platform, and Product owners approve `GO`.

## Required Documentation Updates Before Sign-Off

- [ ] Replace the template in `docs/development/phase-7/phase-summary.md` with actual evidence.
- [ ] Rewrite `docs/MVP-ACCEPTANCE.md` from the final release commit.
- [ ] Synchronize `docs/SPEC.md`, `docs/SECURITY.md`, `docs/ENVIRONMENT.md`, `docs/DEPLOYMENT.md`, `docs/OBSERVABILITY.md`, and `docs/RUNBOOKS.md`.
- [ ] Record every accepted risk with owner, mitigation, expiry/review date, and explicit product approval.

## Final Handoff Template

```markdown
## Production Readiness Handoff

- Release commit:
- CI run:
- Staging URLs:
- Migration result:
- Test result:
- E2E result:
- Security result:
- Billing result:
- Monitoring result:
- Open risks:
- Rollback point:
- Engineering approval:
- Platform approval:
- Product approval:
- Decision: GO / NO-GO
```
