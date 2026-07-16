# KCLUB MVP v4 Technical Specification

| Field                | Value                             |
| -------------------- | --------------------------------- |
| Document version     | `0.3.0`                           |
| Product version      | MVP v4                            |
| Status               | Ready for implementation planning |
| Last updated         | 2026-06-13                        |
| Primary architecture | Monorepo with two deployable apps |

## 1. Product Summary

KCLUB is an international private membership platform for the USA market. MVP v4 delivers:

- A public multilingual website and member cabinet.
- Public self-service member registration by phone verification and password.
- Digital club cards with public QR verification.
- VIP subscription billing through Stripe.
- Partner business profile moderation and paid placement.
- Business Introductions for eligible VIP business members.
- A private staff admin dashboard with stronger staff authentication.

MVP explicitly excludes MLM mechanics, public card lookup by arbitrary form, custom invoice UI, and guest-only partner cabinets.

## 2. Architecture Contract

KCLUB is implemented as a monorepo with two deployable applications and shared internal packages.

| App                 | Purpose                                                                                                                    | Public URL model                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `apps/product-core` | Public marketing, member auth/cabinet, public directory, public card verification, product API, Stripe webhooks, cron jobs | `/{locale}/...` and `/api/v1/*`   |
| `apps/admin-app`    | Staff operations dashboard and staff auth shell                                                                            | admin subdomain, no locale prefix |

Shared source lives under `packages/*`. The apps are deployed independently, but API contracts, domain policies, validation schemas, database types, permissions, error codes, and UI primitives are versioned atomically in one repository.

The admin app does not own product business logic. It authenticates staff, renders operational UI, and calls product-core admin APIs through an admin BFF/proxy boundary.

## 3. Monorepo Package Boundaries

| Package               | Owns                                                                                       | Must not own                              |
| --------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `packages/contracts`  | DTOs, API request/response types, error codes, permission constants, route contract types  | Secrets, DB clients, Stripe clients       |
| `packages/validation` | Zod schemas and reusable validation helpers                                                | Route handlers, DB writes                 |
| `packages/domain`     | Pure state machines and policies for cards, businesses, subscriptions, introductions, RBAC | Network, filesystem, runtime side effects |
| `packages/database`   | SQL migrations, generated DB types, seed data, schema documentation                        | App-specific UI logic                     |
| `packages/ui`         | Shared design tokens and reusable React primitives                                         | Product-specific flows                    |
| `packages/config`     | Shared TypeScript, ESLint, Tailwind, Prettier, env schema utilities                        | Environment values                        |
| `packages/test-utils` | Shared fixtures, factories, contract test helpers                                          | Production runtime code                   |

Server-only integrations remain in app-owned server modules:

- Supabase service-role access.
- Stripe SDK calls and webhook verification.
- Admin JWT signing.
- Email delivery.
- Cron route handlers.

## 4. Package Manager and Build Tooling

Default package manager: **Bun**.

Use Bun for dependency installation, workspace management, lockfile ownership, and local script execution. Use Turborepo for task orchestration, caching, and package graph awareness.

Required root conventions:

- `packageManager` in root `package.json`, pinned to a Bun version.
- `workspaces`: `["apps/*", "packages/*"]`.
- Single `bun.lock`.
- No mixed lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`) unless a migration explicitly requires temporary coexistence.
- Root scripts call `turbo`, for example `bun run dev`, `bun run build`, `bun run typecheck`, `bun run test`.

Runtime decision:

- Vercel/Next.js production runtime remains the standard Next.js runtime unless a specific app is proven safe to run on Bun.
- Bun is approved as package manager and dev runner, not as a blanket replacement for every production Node runtime.
- If a Next.js, Supabase, Stripe, or Vercel integration blocks on Bun package-manager compatibility, the fallback is `pnpm`, not split repositories.

## 5. Roles and Permissions

### 5.1 Member Capabilities

| Capability                      | MEMBER  |  VIP   | Has submitted business |
| ------------------------------- | :-----: | :----: | :--------------------: |
| Digital club card               |   Yes   |  Yes   |          Yes           |
| Public partner directory access |   Yes   |  Yes   |          Yes           |
| VIP subscription management     | Upgrade | Manage |           No           |
| Submit business profile         |   No    |  Yes   |           No           |
| Manage own business profile     |   No    |   No   |          Yes           |
| Business Introductions          |   No    |   No   |           No           |

### 5.2 Staff Roles

Staff identities are separate from member identities. One person may have both a member account and a staff account, but they authenticate through different flows and permission contexts.

Operational hierarchy: `OWNER >= ADMIN >= MODERATOR`.

`SUPPORT` is a parallel read-only investigation role, not part of the hierarchy.

| Role        | Purpose                                                          |
| ----------- | ---------------------------------------------------------------- |
| `OWNER`     | Platform ownership, billing configuration, staff role assignment |
| `ADMIN`     | User operations, cards, subscriptions, audit visibility          |
| `MODERATOR` | Business, catalog, taxonomy, and introduction moderation         |
| `SUPPORT`   | Strictly read-only investigation                                 |

| Action                                    | OWNER | ADMIN | MODERATOR | SUPPORT |
| ----------------------------------------- | :---: | :---: | :-------: | :-----: |
| Dashboard metrics                         |  Yes  |  Yes  |    Yes    |   Yes   |
| Search users                              |  Yes  |  Yes  |    No     |   No    |
| Block or unblock users                    |  Yes  |  Yes  |    No     |   No    |
| Revoke or re-issue cards                  |  Yes  |  Yes  |    No     |   No    |
| View subscriptions                        |  Yes  |  Yes  |    Yes    |   Yes   |
| Cancel subscription as admin override     |  Yes  |  Yes  |    No     |   No    |
| Review, approve, publish, hide businesses |  Yes  |  Yes  |    Yes    |   No    |
| Manage Business Introductions             |  Yes  |  Yes  |    Yes    |   No    |
| CRUD categories, countries, cities        |  Yes  |  Yes  |    Yes    |   No    |
| Toggle homepage featured flags            |  Yes  |  Yes  |    Yes    |   No    |
| Manage Stripe Price IDs                   |  Yes  |  No   |    No     |   No    |
| Manage staff roles                        |  Yes  |  No   |    No     |   No    |
| View audit log                            |  Yes  |  Yes  |    No     |   Yes   |
| Add internal notes                        |  Yes  |  Yes  |    Yes    |   No    |

## 6. Authentication and Sessions

### 6.1 Member Auth

Member auth uses a verified phone number and password through Supabase Auth. SMS OTP is used only to verify a phone during sign-up and to set or reset a member password.

- Sign-up creates a new member account when the phone is new, stores the password in Supabase Auth, and requires SMS verification before the local member record is created.
- Sign-in authenticates an existing member account with phone and password; it never sends an OTP.
- Existing OTP-only members use password recovery once to verify their phone and set a password.
- Existing-phone sign-up must return a clear "use sign-in" state.
- Unknown-phone sign-in must return a clear "use sign-up" state.

After first sign-up, the account is `ACTIVE` but incomplete until onboarding finishes.

### 6.2 Member Onboarding

All authenticated members with incomplete onboarding are redirected from `/m/*` routes, except onboarding and sign-out, to `/{locale}/m/onboarding`.

Required onboarding fields:

| Field               | Required | Notes                          |
| ------------------- | -------- | ------------------------------ |
| `phone`             | Yes      | Verified by OTP and prefilled  |
| `display_name`      | Yes      | Minimum 2 chars; shown on card |
| `locale_preference` | Yes      | `en`, `ru`, or `uk`            |
| `terms_accepted_at` | Yes      | Stored timestamp               |

`isOnboardingComplete()` is true when `display_name`, `locale_preference`, and `terms_accepted_at` are all present.

Completing onboarding auto-issues one active club card.

### 6.3 Staff Auth

Staff auth uses OWNER-approved phone numbers plus staff passwords.

Flow:

1. OWNER approves a staff phone number and role in the admin dashboard.
2. Staff registers a password for the approved phone.
3. Staff signs in with phone and password.
4. Admin session is issued as an httpOnly, secure, sameSite=strict cookie.
5. Session TTL is 8 hours.

Phones that are not approved by an OWNER must not register or sign in.

## 7. Routes

### 7.1 Product-Core Public and Member Routes

All public localized routes use `/{locale}` where locale is `en`, `ru`, or `uk`.

| Route                                | Access                   | Notes                        |
| ------------------------------------ | ------------------------ | ---------------------------- |
| `/{locale}`                          | Public                   | Home page                    |
| `/{locale}/directory`                | Public                   | Published businesses only    |
| `/{locale}/directory/{slug}`         | Public                   | Published business detail    |
| `/{locale}/verify-card/{cardNumber}` | Public                   | PII-safe card verification   |
| `/{locale}/sign-in`                  | Public                   | Existing member sign-in      |
| `/{locale}/sign-up`                  | Public                   | New member sign-up           |
| `/{locale}/m/onboarding`             | Auth                     | Required onboarding          |
| `/{locale}/m/dashboard`              | Auth + onboarding        | Main tabbed member area      |
| `/{locale}/m/introduce`              | VIP + published business | Submit Business Introduction |
| `/{locale}/m/card`                   | Auth                     | Redirect to dashboard tab    |
| `/{locale}/m/profile`                | Auth                     | Redirect to dashboard tab    |
| `/{locale}/m/subscription`           | Auth                     | Redirect to dashboard tab    |
| `/{locale}/m/my-business`            | Auth                     | Redirect to dashboard tab    |
| `/{locale}/m/checkout/success`       | Auth                     | Stripe return                |
| `/{locale}/m/checkout/cancel`        | Auth                     | Stripe return                |

### 7.2 Member Dashboard Tabs

| Tab             | MEMBER | VIP | Has submitted business |
| --------------- | :----: | :-: | :--------------------: |
| `account`       |  Yes   | Yes |          Yes           |
| `catalog`       |  Yes   | Yes |          Yes           |
| `subscription`  |  Yes   | Yes |           No           |
| `business`      |   No   | No  |          Yes           |
| `introductions` |   No   | Yes |           No           |
| `settings`      |  Yes   | Yes |          Yes           |

VIP upgrade is initiated from the Subscription tab. Business onboarding is initiated from the Subscription tab and opens a multi-step wizard at `/{locale}/m/business/onboarding`. After a business application is submitted (`UNDER_REVIEW` or later), the Subscription and Introductions tabs are hidden until product rules say otherwise; the Business tab shows application status.

Hidden tabs are not rendered and are also denied at data/API level.

### 7.3 Admin Routes

Admin routes are unlocalized and `robots: noindex, nofollow`.

| Route              | Min role         | Notes                                     |
| ------------------ | ---------------- | ----------------------------------------- |
| `/sign-in`         | Public staff     | Approved phone + password sign-in         |
| `/auth/register`   | Public staff     | Password registration for approved phones |
| `/`                | MODERATOR        | Dashboard metrics                         |
| `/users`           | ADMIN            | Search and block users                    |
| `/users/[id]`      | ADMIN            | Profile, card, subscriptions, audit trail |
| `/cards`           | ADMIN            | Card list, revoke, re-issue               |
| `/catalog`         | MODERATOR        | Featured homepage toggles                 |
| `/businesses`      | MODERATOR        | Review queues                             |
| `/businesses/[id]` | MODERATOR        | Detail, notes, workflow                   |
| `/introductions`   | MODERATOR        | Introduction queues                       |
| `/categories`      | MODERATOR        | Taxonomy                                  |
| `/countries`       | MODERATOR        | Reference data                            |
| `/cities`          | MODERATOR        | Reference data                            |
| `/memberships`     | ADMIN            | Read-mostly plan metadata                 |
| `/subscriptions`   | ADMIN            | Stripe-synced subscriptions               |
| `/stripe-prices`   | OWNER            | Stripe Price IDs                          |
| `/staff`           | OWNER            | Staff accounts and roles                  |
| `/audit`           | ADMIN or SUPPORT | Read-only audit                           |
| `/settings`        | OWNER            | Platform settings                         |

## 8. Status Models

### 8.1 User

| Status    | Meaning                                            |
| --------- | -------------------------------------------------- |
| `ACTIVE`  | Phone verified; onboarding may still be incomplete |
| `BLOCKED` | Sign-in denied and active card revoked             |

### 8.2 Club Card

| Status    | Meaning                               |
| --------- | ------------------------------------- |
| `ACTIVE`  | Valid for display and QR verification |
| `REVOKED` | Manually revoked                      |
| `EXPIRED` | Past expiration                       |

Rules:

- Onboarding auto-issues one `MEM-*` card.
- At most one active card per user.
- Card numbers use shared monotonic sequence: `{TIER}-{6-digit-sequence}`.
- MEMBER to VIP upgrade does not automatically re-issue the card.
- Admin may manually re-issue a VIP card.

### 8.3 VIP Subscription

Stripe is source of truth. Local subscription tables are caches and audit records.

| Status     | Meaning                                                               |
| ---------- | --------------------------------------------------------------------- |
| `NONE`     | No VIP subscription                                                   |
| `ACTIVE`   | Paid and current                                                      |
| `PAST_DUE` | Payment failed; Stripe grace period applies                           |
| `CANCELED` | Cancel at period end; VIP access continues until `current_period_end` |
| `EXPIRED`  | Subscription ended; VIP capabilities denied                           |

### 8.4 Business Profile

| Status         | Meaning                                           |
| -------------- | ------------------------------------------------- |
| `UNDER_REVIEW` | Submitted and waiting for moderation              |
| `APPROVED`     | Verified; owner can start placement checkout      |
| `PUBLISHED`    | Paid and visible in directory                     |
| `REJECTED`     | Declined with reason                              |
| `HIDDEN`       | Unpublished by admin action or subscription lapse |

The `DRAFT` state is future scope and must not be required for MVP launch.

Featured homepage flags:

| Field                  | Type    | Rule                             |
| ---------------------- | ------- | -------------------------------- |
| `featured_top`         | boolean | True only for `PUBLISHED`; max 3 |
| `featured_recommended` | boolean | True only for `PUBLISHED`; max 3 |

When a business leaves `PUBLISHED`, both featured flags reset to false.

### 8.5 Business Introduction

| Status      | Meaning                   |
| ----------- | ------------------------- |
| `SUBMITTED` | Member submitted          |
| `IN_REVIEW` | Staff reviewing           |
| `APPROVED`  | Accepted for coordination |
| `COMPLETED` | Closed successfully       |
| `REJECTED`  | Declined with reason      |
| `CANCELED`  | Withdrawn                 |

## 9. Billing and Stripe

Product-core owns all Stripe integration.

MVP billing uses:

- Stripe Checkout Sessions for VIP and business placement subscriptions.
- Stripe Subscriptions for recurring billing.
- Stripe Customer Portal for receipts and subscription self-service.
- Stripe email receipts.
- Admin-managed Stripe Price IDs, not Payment Links.
- Webhook endpoint: `POST /api/stripe/webhook`.

Business placement flow:

1. VIP submits business profile.
2. Moderator approves profile: `UNDER_REVIEW -> APPROVED`.
3. User starts placement checkout.
4. Stripe webhook confirms payment.
5. Product-core publishes business: `APPROVED -> PUBLISHED`.

## 10. API Surface

### 10.1 Member and Public API

Base path: `/api/v1`.

| Endpoint                                   | Access                    | Purpose                                 |
| ------------------------------------------ | ------------------------- | --------------------------------------- |
| `POST /auth/sign-up`                       | Public                    | Start phone/password registration       |
| `POST /auth/sign-up/verify`                | Public                    | Verify registration SMS OTP             |
| `POST /auth/sign-in`                       | Public                    | Sign in with phone and password         |
| `POST /auth/password-recovery`             | Public                    | Send password recovery SMS OTP          |
| `POST /auth/password-recovery/verify`      | Public                    | Verify OTP and set a new password       |
| `POST /auth/logout`                        | Auth                      | Logout                                  |
| `GET /me`                                  | Auth                      | Current profile                         |
| `PATCH /me`                                | Auth                      | Update profile                          |
| `POST /me/complete-onboarding`             | Auth                      | Complete onboarding and issue card      |
| `GET /cards`                               | Auth                      | Own active card                         |
| `GET /cards/verify/{cardNumber}`           | Public                    | PII-safe card verification              |
| `GET /businesses`                          | Auth/Public by filter     | Own businesses or published public list |
| `POST /businesses`                         | VIP                       | Submit business for review              |
| `GET /businesses/{id}`                     | Auth/Public by visibility | Detail                                  |
| `PATCH /businesses/{id}`                   | Owner                     | Edit allowed fields while reviewable    |
| `POST /businesses/{id}/checkout-placement` | VIP + approved business   | Create Stripe checkout                  |
| `GET /introductions`                       | Auth                      | Own introductions                       |
| `POST /introductions`                      | VIP + published business  | Submit introduction                     |
| `POST /introductions/{id}/cancel`          | Owner                     | Cancel introduction                     |
| `GET /subscriptions`                       | Auth                      | Own subscriptions                       |
| `GET /subscriptions/{id}`                  | Auth                      | Subscription detail                     |
| `POST /subscriptions/{id}/cancel`          | VIP                       | Cancel at period end                    |

### 10.2 Admin API

Base path: `/api/admin/v1`. Owned by product-core, consumed by admin-app.

| Endpoint group               | Required role    | Purpose                                               |
| ---------------------------- | ---------------- | ----------------------------------------------------- |
| `/users`                     | ADMIN            | List, detail, block, unblock                          |
| `/cards`                     | ADMIN            | List, revoke, re-issue                                |
| `/businesses`                | MODERATOR        | List, detail, approve, reject, hide, featured toggles |
| `/introductions`             | MODERATOR        | List, detail, approve, reject, complete               |
| `/categories`                | MODERATOR        | CRUD                                                  |
| `/countries`                 | MODERATOR        | CRUD                                                  |
| `/cities`                    | MODERATOR        | CRUD                                                  |
| `/subscriptions`             | ADMIN            | Read and admin cancel override                        |
| `/stripe-prices`             | OWNER            | Configure Stripe Price IDs                            |
| `/admin-config`              | OWNER            | Platform configuration                                |
| `/staff`                     | OWNER            | Staff account and role management                     |
| `/audit`                     | ADMIN or SUPPORT | Read audit log                                        |
| `/webhooks/{eventId}/replay` | ADMIN            | Manual webhook replay                                 |

All API responses use the shared envelope from `packages/contracts`.

## 11. Validation Rules

Business profile submission:

- Business name: required, 2-100 chars, no HTML, unique per user except previously rejected submissions.
- Representative name: required, 2-100 chars.
- Email: required, valid email.
- Phone: required, valid phone.
- Country and city: required; city must belong to country.
- Category: required and not high-risk.
- Website or social URL: required, valid URL.
- Brief description: optional, max 2000 chars.
- Caller must have active VIP capability.

Business Introduction:

- Caller must have active VIP capability and a published business.
- Target business must be published.
- Max 10 introductions per day per caller.
- Max 3 introductions to the same target per 30 days.
- Only one pending introduction to the same target at a time.

Featured businesses:

- Max 3 `featured_top`.
- Max 3 `featured_recommended`.
- Enforce under transaction/lock to avoid race conditions.

## 12. Webhooks, Jobs, and Async Work

Stripe webhook events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Webhook requirements:

- Verify Stripe signature.
- Store processed event ID in `stripe_webhook_events`.
- Ignore duplicate event IDs.
- Record audit log for state-changing handlers.

Daily maintenance job:

- Expire active cards past `expires_at`.
- Expire local VIP subscriptions past `current_period_end`.
- Hide published businesses whose owner no longer has VIP capability.
- Reset featured flags when hiding businesses.
- Clean old webhook events after retention period.

## 13. Non-Functional Requirements

- Product public pages must be SEO-friendly.
- Admin pages must be private, authenticated, and noindexed.
- Sensitive fields must not leak into public DTOs.
- All role decisions must be enforced server-side.
- Shared contracts must be covered by contract tests.
- State transitions must be tested at domain-policy level and API level.
- Stripe webhook handlers must be idempotent.
- Migration changes must be reviewed with app changes in the same PR.

## 14. Testing Requirements

Minimum gates before merge:

- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun run test:contracts`
- `bun run build`
- E2E smoke for member sign-up, onboarding, VIP checkout return, business submit, admin moderation, and public directory visibility.

Contract tests must fail if admin-app expects DTO fields, enum values, permissions, or error codes that product-core no longer provides.

## 15. Open Product Decisions

Default assumptions until product signs off:

| ID  | Topic                                 | Default                                                     |
| --- | ------------------------------------- | ----------------------------------------------------------- |
| U1  | MEMBER -> VIP card re-issue           | Keep existing `MEM-*`; admin can manually re-issue `VIP-*`  |
| U2  | Multiple introductions to same target | One pending at a time; 30-day cooldown after terminal state |
| U3  | Canceled VIP access                   | Capabilities remain active until `current_period_end`       |
| U4  | Business draft mode                   | Not in MVP                                                  |

## 16. Changelog

| Version | Date       | Summary                                                                                      |
| ------- | ---------- | -------------------------------------------------------------------------------------------- |
| `0.3.0` | 2026-06-13 | Reframed architecture as monorepo; clarified package boundaries and Bun/Turbo tooling policy |
| `0.2.0` | 2026-06-13 | Added API completeness, validation, webhooks, implementation notes                           |
| `0.1.4` | 2026-06-13 | Featured business flags                                                                      |
| `0.1.3` | 2026-06-13 | Homepage lists show only published businesses                                                |
| `0.1.2` | 2026-06-13 | QR opens public card view directly                                                           |
| `0.1.1` | 2026-06-13 | Public member phone sign-up and card auto-issue                                              |
| `0.1.0` | 2026-06-13 | Product/admin split, phone auth, RBAC rewrite                                                |
