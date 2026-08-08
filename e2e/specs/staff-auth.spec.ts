import { test, expect } from '../fixtures/base';
import { AdminSignInPage } from '../page-objects/admin-sign-in.page';
import { AdminDashboardPage } from '../page-objects/admin-dashboard.page';
import { DEV_STAFF_PASSWORD } from '../helpers/auth';
import { generateTotpFromUri } from '../helpers/totp';

test.describe('Staff auth', () => {
  test.use({ baseURL: 'http://localhost:3001' });

  test('staff signs in with password and reaches the dashboard', async ({ page, seed }) => {
    const { staffPhone } = await seed('staff-owner');
    if (!staffPhone) {
      test.skip();
      return;
    }

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

  test('DB-backed staff completes TOTP to reach the dashboard', async ({ page, seed }) => {
    const { staffPhone } = await seed('staff-db-owner');
    if (!staffPhone) {
      test.skip();
      return;
    }

    const signInPage = new AdminSignInPage(page);
    await signInPage.signIn(staffPhone, DEV_STAFF_PASSWORD);
    await expect(page).toHaveURL(/.*\/auth\/mfa.*/, { timeout: 30000 });

    const currentUrl = new URL(page.url());
    const encodedUri = currentUrl.searchParams.get('uri');
    expect(encodedUri).toBeTruthy();

    const totpUri = decodeURIComponent(encodedUri!);
    const totpCode = generateTotpFromUri(totpUri);
    await signInPage.completeTotp(totpCode);

    await expect(page).toHaveURL(/.*\/dashboard.*/, { timeout: 30000 });
    const dashboardPage = new AdminDashboardPage(page);
    await expect(dashboardPage.sidebar).toBeVisible();
  });
});
