import { test, expect } from '../fixtures/base';
import { AdminSignInPage } from '../page-objects/admin-sign-in.page';
import { AdminDashboardPage } from '../page-objects/admin-dashboard.page';
import { DEV_OTP_CODE, DEV_TOTP_CODE } from '../helpers/mock-otp';

test.describe('Staff auth', () => {
  test.use({ baseURL: 'http://localhost:3001' });

  // FIXME(e2e-auth-flow-stale): admin sign-in migrated to phone+PASSWORD
  // (admin-password-input + admin-submit-sign-in). These specs still drive the
  // removed phone->OTP flow and need an admin password+TOTP rewrite plus an
  // ADMIN_BOOTSTRAP_OWNER_PASSWORD in CI. Tracked separately from the member fix.
  test.fixme('staff sign-in with OTP reaches 2FA screen', async ({ page, seed }) => {
    const { staffPhone } = await seed('staff-owner');
    if (!staffPhone) {
      test.skip();
      return;
    }

    const signInPage = new AdminSignInPage(page);
    await signInPage.goto();

    await signInPage.fillPhone(staffPhone);
    await signInPage.submitPhone();
    // Wait for the server action to complete and navigation to happen
    await expect(page).toHaveURL(/.*\?sent=1.*/);

    await signInPage.fillOtp(DEV_OTP_CODE);
    await signInPage.submitOtp();

    // Should redirect to 2FA required screen
    await expect(page).toHaveURL(/.*\/auth\/(2fa-required|totp-setup).*/);
  });

  test.fixme('TOTP verification grants dashboard access', async ({ page, seed }) => {
    const { staffPhone } = await seed('staff-owner');
    if (!staffPhone) {
      test.skip();
      return;
    }

    const signInPage = new AdminSignInPage(page);
    await signInPage.goto();

    // Complete OTP
    await signInPage.fillPhone(staffPhone);
    await signInPage.submitPhone();
    await expect(page).toHaveURL(/.*\?sent=1.*/, { timeout: 30000 });
    await signInPage.fillOtp(DEV_OTP_CODE);
    await signInPage.submitOtp();

    // Complete TOTP
    await expect(page).toHaveURL(/.*\/auth\/(2fa-required|totp-setup).*/, { timeout: 30000 });
    await page.locator('[data-testid="admin-totp-input"]').fill(DEV_TOTP_CODE);
    await page.locator('[data-testid="admin-submit-totp"]').click();

    // Should reach dashboard
    await expect(page).toHaveURL(/.*\/dashboard.*/, { timeout: 30000 });
    const dashboardPage = new AdminDashboardPage(page);
    await expect(dashboardPage.sidebar).toBeVisible();
  });

  test('unauthenticated user is redirected to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/auth\/sign-in.*/, { timeout: 30000 });
  });

  test.fixme('staff without TOTP cannot access dashboard', async ({ page, seed }) => {
    const { staffPhone } = await seed('staff-owner');
    if (!staffPhone) {
      test.skip();
      return;
    }

    const signInPage = new AdminSignInPage(page);
    await signInPage.goto();

    // Complete OTP only
    await signInPage.fillPhone(staffPhone);
    await signInPage.submitPhone();
    await expect(page).toHaveURL(/.*\?sent=1.*/, { timeout: 30000 });
    await signInPage.fillOtp(DEV_OTP_CODE);
    await signInPage.submitOtp();

    // After OTP, should be on 2FA screen, not dashboard
    await expect(page).toHaveURL(/.*\/auth\/(2fa-required|totp-setup).*/, { timeout: 30000 });

    // Try navigating directly to dashboard
    await page.goto('/dashboard');

    // Should be redirected back to 2FA or sign-in
    const url = page.url();
    expect(url).toMatch(/\/auth\//);
  });
});
