import { test, expect } from '../fixtures/base';
import { AdminSignInPage } from '../page-objects/admin-sign-in.page';
import { AdminDashboardPage } from '../page-objects/admin-dashboard.page';
import { DEV_STAFF_PASSWORD } from '../helpers/auth';
import { DEV_TOTP_CODE } from '../helpers/mock-otp';

test.describe('Staff auth', () => {
  test.use({ baseURL: 'http://localhost:3001' });

  test('staff signs in with password and reaches the dashboard', async ({ page, seed }) => {
    const { staffPhone } = await seed('staff-owner');
    if (!staffPhone) {
      test.skip();
      return;
    }

    // The bootstrap owner (ADMIN_BOOTSTRAP_OWNER_PHONE) signs in with phone +
    // password and skips TOTP, landing directly on the dashboard.
    const signInPage = new AdminSignInPage(page);
    await signInPage.signIn(staffPhone, DEV_STAFF_PASSWORD);

    await expect(page).toHaveURL(/.*\/dashboard.*/, { timeout: 30000 });
    const dashboardPage = new AdminDashboardPage(page);
    await expect(dashboardPage.sidebar).toBeVisible();
  });

  test('unauthenticated user is redirected to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/auth\/sign-in.*/, { timeout: 30000 });
  });

  // FIXME(e2e-admin-auth-rewrite): TOTP is only enforced for DB-backed staff
  // (UUID id), but CI has an empty ADMIN_STAFF_ALLOWLIST_JSON so only the
  // bootstrap owner exists — and it skips TOTP. To exercise the real MFA flow,
  // add an allowlisted staff phone + seed an adminUsers row, then compute a live
  // TOTP code from the setup secret (otplib) since there is no dev TOTP bypass.
  test.fixme('DB-backed staff completes TOTP to reach the dashboard', async ({ page, seed }) => {
    const { staffPhone } = await seed('staff-owner');
    if (!staffPhone) {
      test.skip();
      return;
    }

    const signInPage = new AdminSignInPage(page);
    await signInPage.signIn(staffPhone, DEV_STAFF_PASSWORD);
    await expect(page).toHaveURL(/.*\/auth\/mfa.*/, { timeout: 30000 });
    await signInPage.completeTotp(DEV_TOTP_CODE);
    await expect(page).toHaveURL(/.*\/dashboard.*/, { timeout: 30000 });
  });
});
