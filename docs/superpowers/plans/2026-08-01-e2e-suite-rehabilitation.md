# E2E Suite Rehabilitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the CI `e2e` job fully green by repairing the pre-existing bit-rot the job exposed once it finally ran on PR #38.

**Architecture:** The e2e suite went dormant (the `better-sqlite3` install break failed `validate` before `e2e` could run), so specs/page-objects drifted from a redesigned UI. Sign-in (OTP→password) and the `memberCards.user` relation are already fixed and green. This plan fixes the remaining layers: dashboard tab/card test ids (already applied, uncommitted), billing's removed subscription tab, the moved introduce flow, a second server-render bug, and the admin/staff auth flow.

**Tech Stack:** pnpm workspaces + turbo, Next.js 15 (App Router, prod build = webpack), Playwright, Drizzle ORM (postgres-js), Supabase auth (mocked in e2e via `/api/v1/test/mock-supabase`), Stripe (mocked).

## Global Constraints

- **e2e cannot run locally** — no local throwaway Postgres; local `DATABASE_URL` is the shared remote dev Supabase. Per-task "run the test" = **push to `feat/introdusing` (PR #38) and read the CI `e2e` job** via `gh run view <run-id> --log-failed --job <job-id>`. Never seed/run e2e against the local (remote-dev) DB.
- **Local gates before every push** (all must pass): `npx playwright test --list` (specs compile), `pnpm --filter @kclub/product-core exec tsc --noEmit` (0 errors), `npx prettier --check <changed files>`. Server-render bugs (Task 4) also get a local prod-build reproduction.
- **Branch:** `feat/introdusing` (PR #38 → `main`). Commit style: conventional, imperative, no AI fingerprints. App test ids use kebab-case matching existing patterns (`auth-*`, `admin-*`, `dashboard-tab-*`).
- **Don't regress green tests.** After each push, confirm the previously-green set (recommendations-tab, sign-up, card-verification, public-visitor except business-detail) stays green and admin tests stay skipped until Task 5.
- **Implemented member tabs** (source of truth, `apps/product-core/src/features/member/dashboard-tabs.ts`): `details, business, recommendations, introductions, settings`. There is **no** `card` or `subscription` tab; the card and VIP-upgrade live inside the `details` tab (`AccountPanel`). The `introductions` ("Recommend a Client") tab is visible only to **VIP without a business** (`isVip && !hasBusiness`).

---

## Task 0: Commit the already-applied dashboard tab + card id fixes

Working-tree changes are already implemented and pass local gates; this task just commits/pushes them and confirms the first batch of tests flips green.

**Files (already modified, uncommitted):**

- Modify: `apps/product-core/src/features/member/components/cabinet/MemberCabinetShell.tsx` (added `data-testid={`dashboard-tab-${tab}`}` on `TabsTrigger`)
- Modify: `apps/product-core/src/features/member/components/KylyvnykClubCard.tsx` (added `data-testid="card-number"` on the status node)
- Modify: `e2e/helpers/selectors.ts` (`DASHBOARD_TAB_*` → `[data-testid="dashboard-tab-<name>"]`)
- Modify: `e2e/page-objects/dashboard.page.ts` (`getTab` maps real tabs; `getVisibleTabNames` iterates `details,business,recommendations,introductions,settings`)
- Modify: `e2e/specs/member-journey.spec.ts` (tab assertions → `details`+`settings` present, `business`/`recommendations`/`introductions` absent)

**Interfaces produced:** app renders `[data-testid="dashboard-tab-<tab>"]` and `[data-testid="card-number"]`, consumed by all later tab-driven specs.

- [ ] **Step 1: Run local gates**

Run: `npx playwright test --list` → Expected: `Total: 20 tests in 7 files`, no errors.
Run: `cd apps/product-core && npx tsc --noEmit` → Expected: exit 0.
Run: `npx prettier --check apps/product-core/src/features/member/components/cabinet/MemberCabinetShell.tsx apps/product-core/src/features/member/components/KylyvnykClubCard.tsx e2e/helpers/selectors.ts e2e/page-objects/dashboard.page.ts e2e/specs/member-journey.spec.ts` → Expected: "All matched files use Prettier code style!"

- [ ] **Step 2: Commit**

```bash
git add apps/product-core/src/features/member/components/cabinet/MemberCabinetShell.tsx apps/product-core/src/features/member/components/KylyvnykClubCard.tsx e2e/helpers/selectors.ts e2e/page-objects/dashboard.page.ts e2e/specs/member-journey.spec.ts
git commit -m "test(e2e): retarget dashboard tab + card selectors to Radix test ids"
```

- [ ] **Step 3: Push and read CI**

Run: `git push`, then find the run: `gh pr checks 38`, then `gh run view <run-id> --log-failed --job <e2e-job-id>`.
Expected NEWLY GREEN: `business-lifecycle "VIP submits business profile"`, `member-journey "card display after onboarding"`, `member-journey "dashboard shows correct tabs for MEMBER tier"`. Still red (later tasks): billing ×2, introduction "VIP submits introduction", public-visitor "business detail page renders".

---

## Task 1b: Rewrite billing-flow to the AccountPanel VIP-upgrade UX

**Why:** `billing-flow.spec.ts` clicks a removed `subscription` tab and a removed `subscription-upgrade-btn`. VIP upgrade is now a button in `AccountPanel` (details tab) that POSTs to `MEMBER_API_ROUTES.SUBSCRIPTION_CHECKOUT` and redirects to the returned `checkoutUrl`; the current plan renders as a `Badge` (`planLabel`, `AccountPanel.tsx:135`).

**Files:**

- Modify: `apps/product-core/src/features/member/components/AccountPanel.tsx` (add `data-testid="vip-upgrade-btn"` to the upgrade `<button>` ~line 164; add `data-testid="subscription-status"` to the plan `<Badge>` ~line 135)
- Modify: `e2e/specs/billing-flow.spec.ts` (rewrite both tests)
- Read for context: `e2e/helpers/mock-stripe.ts` (`interceptStripeCheckout`, `simulateVipCheckoutComplete`), `apps/product-core/src/app/api/v1/subscriptions/checkout/route.ts`

**Interfaces produced:** `[data-testid="vip-upgrade-btn"]`, `[data-testid="subscription-status"]`.

- [ ] **Step 1: Spike — confirm the e2e checkout path**

The upgrade button calls `SUBSCRIPTION_CHECKOUT` server-side, which creates a Stripe session. Read `apps/product-core/src/app/api/v1/subscriptions/checkout/route.ts` and its service. Determine whether, under the e2e env, session creation returns a usable `checkoutUrl` without real Stripe (look for an E2E/dev branch or a `STRIPE_*` test key in `.github/workflows/ci.yml`). If the server call would fail in CI, prefer asserting the **redirect attempt** (button click triggers navigation) over asserting a live Stripe session, and record the finding in the spec comment.

- [ ] **Step 2: Add the test ids**

In `AccountPanel.tsx`, on the plan badge (`<Badge variant="outline" size="sm">{planLabel}</Badge>`) add `data-testid="subscription-status"`. On the upgrade `<button type="button" onClick={handleVipCheckout} …>` add `data-testid="vip-upgrade-btn"`.

- [ ] **Step 3: Rewrite billing-flow.spec.ts**

```ts
import { test, expect } from '../fixtures/base';
import { signInMember } from '../helpers/auth';
import { interceptStripeCheckout, simulateVipCheckoutComplete } from '../helpers/mock-stripe';

test.describe('Billing flow', () => {
  test('VIP upgrade starts checkout from the account tab', async ({ page, locale, seed }) => {
    const { phone, userId } = await seed('member-with-card');
    if (!phone || !userId) {
      test.skip();
      return;
    }

    const successUrl = `http://localhost:3000/${locale}/m/checkout/success`;
    await interceptStripeCheckout(page, successUrl);
    await signInMember(page, locale, phone);

    // Upgrade button lives on the default (details) tab.
    const upgrade = page.locator('[data-testid="vip-upgrade-btn"]');
    await expect(upgrade).toBeVisible();
    await upgrade.click();

    // Checkout redirect (intercepted) lands on the success URL.
    await expect(page).toHaveURL(new RegExp(`/${locale}/m/checkout/success`), { timeout: 30000 });
  });

  test('account tab shows VIP after checkout webhook', async ({ page, locale, seed }) => {
    const { phone, userId } = await seed('member-with-card');
    if (!phone || !userId) {
      test.skip();
      return;
    }

    await simulateVipCheckoutComplete(userId);
    await signInMember(page, locale, phone);

    await expect(page.locator('[data-testid="subscription-status"]')).toContainText(/vip/i);
  });
});
```

- [ ] **Step 4: Local gates + commit**

Run the Global-Constraints local gates on the two changed files.

```bash
git add apps/product-core/src/features/member/components/AccountPanel.tsx e2e/specs/billing-flow.spec.ts
git commit -m "test(e2e): rewrite billing-flow for the account-tab VIP upgrade"
```

- [ ] **Step 5: Push and read CI**

Expected NEWLY GREEN: both billing-flow tests. If Step-1 spike showed live-Stripe is required and unavailable in CI, keep test 1 asserting the click/redirect attempt and note it; do not leave it red silently.

---

## Task 3: Rewrite introduction-flow to the in-cabinet "Recommend a Client" tab

**Why:** `/m/introduce` is now a redirect stub (`introduce/page.tsx:12`). The flow moved into the cabinet `introductions` tab, rendered by `IntroductionsPanel` (Radix `Select` for target business + `Textarea` for message + submit). That tab is visible only to **VIP without a business**, so the old `vip-with-published-business` seed can't even see it.

**Files:**

- Modify: `apps/product-core/src/features/member/components/IntroductionsPanel.tsx` (add test ids: `intro-target-business` on the `SelectTrigger`, `intro-message` on the `Textarea`, `intro-submit` on the submit `<button>`, `intro-submit-success` on the success `AlertDescription`)
- Modify: `e2e/page-objects/introduce.page.ts` (drive the in-cabinet flow)
- Modify: `e2e/specs/introduction-flow.spec.ts` (test 1 rewrite + seed change)

**Interfaces produced:** `[data-testid="intro-target-business"|"intro-message"|"intro-submit"|"intro-submit-success"]`.

- [ ] **Step 1: Confirm the tab + form**

Read `IntroductionsPanel.tsx`. Confirm: the target-business `Select` (`onValueChange={(v) => setSelectedTargetBusinessId(...)}`), the message `Textarea` (`value={message}`), the submit button, and the success alert (`t('submitSuccess')`). Confirm the `introductions` tab label is "Recommend a Client" and requires `isVip && !hasBusiness` (`packages/domain/src/rbac-policy.ts`).

- [ ] **Step 2: Add test ids in IntroductionsPanel.tsx**

Add `data-testid="intro-target-business"` to the `SelectTrigger`, `data-testid="intro-message"` to the `Textarea`, `data-testid="intro-submit"` to the submit `<button>`, and `data-testid="intro-submit-success"` to the success `AlertDescription` element.

- [ ] **Step 3: Rewrite IntroducePage page-object**

```ts
import type { Page, Locator } from '@playwright/test';

export class IntroducePage {
  constructor(
    private readonly page: Page,
    private readonly locale = 'en',
  ) {}

  async openFromDashboard(): Promise<void> {
    await this.page.goto(`/${this.locale}/m/dashboard`);
    await this.page.locator('[data-testid="dashboard-tab-introductions"]').click();
  }

  async selectFirstTarget(): Promise<void> {
    await this.page.locator('[data-testid="intro-target-business"]').click();
    await this.page.getByRole('option').first().click();
  }

  async fillMessage(msg: string): Promise<void> {
    await this.page.locator('[data-testid="intro-message"]').fill(msg);
  }

  async submit(): Promise<void> {
    await this.page.locator('[data-testid="intro-submit"]').click();
  }

  get success(): Locator {
    return this.page.locator('[data-testid="intro-submit-success"]');
  }
}
```

- [ ] **Step 4: Rewrite introduction-flow.spec.ts test 1**

Seed a VIP-without-business recommender **and** a published target business. Keep the admin test as `test.fixme` (Task 5).

```ts
test('VIP member submits an introduction', async ({ page, locale, seed }) => {
  await seed('published-businesses'); // provides a published target to recommend
  const { phone } = await seed('vip-member');
  if (!phone) {
    test.skip();
    return;
  }

  await signInMember(page, locale, phone);

  const introduce = new IntroducePage(page, locale);
  await introduce.openFromDashboard();
  await introduce.selectFirstTarget();
  await introduce.fillMessage('E2E test introduction message');
  await introduce.submit();

  await expect(introduce.success).toBeVisible();
});
```

- [ ] **Step 5: Local gates + commit + push + read CI**

```bash
git add apps/product-core/src/features/member/components/IntroductionsPanel.tsx e2e/page-objects/introduce.page.ts e2e/specs/introduction-flow.spec.ts
git commit -m "test(e2e): rewrite introduction-flow for the in-cabinet recommend flow"
```

Expected NEWLY GREEN: `introduction-flow "VIP member submits an introduction"`.

---

## Task 4: Root-cause and fix the business-detail server-render bug

**Why:** `public-visitor.spec.ts "business detail page renders"` throws a production Server Components render error not fixed by the `memberCards` relation. Source: `getPublishedBusinessOrNull` → `getCachedPublicBusinessBySlug` (`server/cache/business-cache.ts`) → `getPublicBusinessBySlug` (`server/services/business-service.ts`), wrapped in `unstable_cache`. This is a debugging task (root cause unknown until reproduced) — use `superpowers:systematic-debugging`; do NOT guess a fix.

**Files:**

- Investigate: `apps/product-core/src/server/services/business-service.ts` (`getPublicBusinessBySlug`), `packages/database/src/relations.ts`
- Fix target: whichever query/relation/serialization the reproduction implicates (most likely another missing Drizzle relation used by the slug query, or an `unstable_cache` non-serializable return)

- [ ] **Step 1: Reproduce in a local production build**

```bash
pnpm --filter @kclub/product-core build
cd apps/product-core && npx next start -p 3100 &
# find a published slug, or use a bogus one (the query builds before hitting rows)
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3100/en/directory/nonexistent-xyz"
```

Read the server stderr for the stack (e.g. `at z.buildRelationalQueryWithoutPK` = a missing relation, like the memberCards bug; or a cache serialization error). Kill the server when done (`taskkill //PID <pid> //F`).

- [ ] **Step 2: Identify the exact cause**

Open `getPublicBusinessBySlug` and list every `with: { … }` relation it requests. Cross-check each against defined `*Relations` in `packages/database/src/relations.ts` (same method that found `memberCardsRelations`). If a relation is missing, that's the cause. If the stack points elsewhere (cache/serialization), follow it.

- [ ] **Step 3: Fix at the source**

If a missing relation: add it to `packages/database/src/relations.ts`, mirroring:

```ts
export const <table>Relations = relations(<table>, ({ one, many }) => ({
  <name>: one(<target>, { fields: [<table>.<fk>], references: [<target>.id] }),
}));
```

Rebuild the package: `pnpm --filter @kclub/database build`.

- [ ] **Step 4: Verify locally (no e2e needed)**

Rebuild + restart the prod server, curl the same URL, confirm **0** render errors in the server log. Run `cd packages/database && npx vitest run` and `cd apps/product-core && npx tsc --noEmit` (both green).

- [ ] **Step 5: Commit + push + read CI**

```bash
git add packages/database/src/relations.ts   # (+ any other fixed source)
git commit -m "fix(<scope>): <the specific relation/render fix from Step 2>"
```

Expected NEWLY GREEN: `public-visitor "business detail page renders"`.

---

## Task 5: Restore the admin/staff auth flow (currently `test.fixme`)

**Why:** Admin staff sign-in moved to **phone + password (+ TOTP)** — `admin-phone-input`, `admin-password-input`, `admin-submit-sign-in`, then `admin-totp-input`/`admin-submit-totp`. `AdminSignInPage`, `staff-auth.spec.ts` (3 fixme tests), and the admin steps of `business-lifecycle`/`introduction-flow` still drive the removed OTP flow. CI has no `ADMIN_BOOTSTRAP_OWNER_PASSWORD`. This is a different app and the most uncertain phase — do it last, after Tasks 0/1b/3/4 are green.

**Files:**

- Investigate: `apps/admin-app/src/app/auth/sign-in/*` (`signInStaffAction`), the staff-auth service, whether a dev password/OTP bypass exists (`ADMIN_STAFF_DEV_OTP`/`ADMIN_STAFF_DEV_TOTP` env in `.github/workflows/ci.yml`)
- Modify: `e2e/page-objects/admin-sign-in.page.ts`, `e2e/specs/staff-auth.spec.ts`
- Remove `test.fixme` in: `e2e/specs/staff-auth.spec.ts` (3 tests), `e2e/specs/business-lifecycle.spec.ts` ("staff approves business in admin"), `e2e/specs/introduction-flow.spec.ts` ("staff reviews introduction in admin")
- Possibly modify: `.github/workflows/ci.yml` (add `ADMIN_BOOTSTRAP_OWNER_PASSWORD`), `apps/product-core/src/app/api/v1/test/seed/route.ts` (`staff-owner` sets a known password hash)

- [ ] **Step 1: Map the staff sign-in server action**

Read `signInStaffAction` and the staff-auth service. Determine: does password auth check `adminUsers.password_hash` (argon2) directly, or via Supabase? Is there a dev bypass keyed on `ADMIN_STAFF_DEV_OTP`/`_TOTP`? What is the exact URL sequence: `/auth/sign-in` → `?sent=1`? → `/auth/2fa-required` | `/auth/totp-setup` → `/dashboard`? Record it before touching tests.

- [ ] **Step 2: Make a known staff credential available in CI**

Based on Step 1: either add `ADMIN_BOOTSTRAP_OWNER_PASSWORD: <value>` to the `e2e` job env in `.github/workflows/ci.yml` and have the `staff-owner` seed set that argon2 hash on the bootstrap owner, or wire the discovered dev-password bypass. Keep TOTP on the dev code (`ADMIN_STAFF_DEV_TOTP=123456`).

- [ ] **Step 3: Rewrite AdminSignInPage**

Replace `submitPhone`/`fillOtp`/`submitOtp` with a phone+password sign-in plus the TOTP step:

```ts
async signIn(phone: string, password: string): Promise<void> {
  await this.page.goto('/auth/sign-in');
  await this.page.locator('[data-testid="admin-phone-input"]').fill(phone);
  await this.page.locator('[data-testid="admin-password-input"]').fill(password);
  await this.page.locator('[data-testid="admin-submit-sign-in"]').click();
}
async completeTotp(code: string): Promise<void> {
  await this.page.locator('[data-testid="admin-totp-input"]').fill(code);
  await this.page.locator('[data-testid="admin-submit-totp"]').click();
}
```

- [ ] **Step 4: Un-fixme and update the 5 admin tests**

In `staff-auth.spec.ts` change the 3 `test.fixme(` back to `test(` and drive `signIn(staffPhone, ADMIN_PASSWORD)` + `completeTotp(DEV_TOTP_CODE)` per the URL sequence from Step 1. Do the same for the admin blocks of `business-lifecycle` "staff approves" and `introduction-flow` "staff reviews" (remove their `test.fixme` + FIXME comments).

- [ ] **Step 5: Local gates + commit + push + read CI**

```bash
git add e2e/page-objects/admin-sign-in.page.ts e2e/specs/staff-auth.spec.ts e2e/specs/business-lifecycle.spec.ts e2e/specs/introduction-flow.spec.ts .github/workflows/ci.yml apps/product-core/src/app/api/v1/test/seed/route.ts
git commit -m "test(e2e): restore admin staff phone+password+TOTP sign-in"
```

Expected: all admin tests run and pass; whole `e2e` job green. Also update the backlog: resolve `e2e-auth-flow-stale` and `e2e-next-bitrot-layer`.

---

## Verification (whole plan)

- **Per task:** local gates (`playwright test --list`, `tsc`, `prettier --check`) green → commit → push → `gh run view <run-id> --log-failed --job <e2e-job-id>` shows the task's target tests newly green with no regressions. Task 4 adds a local prod-build repro (0 server errors) before pushing.
- **Done when:** the CI `e2e` job passes with 0 failures and 0 fixme skips, and `validate` stays green. Vercel `admin-app` failing is out of scope (separate pre-existing Vercel-project config issue).

## Self-review notes

- Coverage: every currently-failing/fixme e2e test maps to a task — billing×2 (1b), introduction #1 (3), business-detail (4), member-journey card/tabs + business-lifecycle #1 (0), 5 admin tests (5).
- Uncertainty flagged honestly: Tasks 1b Step 1 (server Stripe), 4 (unknown root cause until reproduced), 5 Steps 1–2 (staff-auth internals + CI secret) are spike-first; their exact fix emerges from the investigation step, with the method spelled out.
- Test-id naming is consistent across tasks (`dashboard-tab-*`, `vip-upgrade-btn`, `subscription-status`, `intro-*`, `card-number`).
