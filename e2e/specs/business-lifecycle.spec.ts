import { test, expect } from '../fixtures/base';
import { DashboardPage } from '../page-objects/dashboard.page';
import { MyBusinessPage } from '../page-objects/my-business.page';
import { DirectoryPage } from '../page-objects/directory.page';
import { AdminBusinessesPage } from '../page-objects/admin-businesses.page';
import { DEV_OTP_CODE, DEV_TOTP_CODE } from '../helpers/mock-otp';
import { signInMember } from '../helpers/auth';
import { simulateBusinessPlacementComplete } from '../helpers/mock-stripe';

test.describe('Business lifecycle', () => {
  // FIXME(e2e-next-bitrot-layer): business creation moved from a dashboard
  // "business" tab (gone for a business-less VIP) to the /m/business/onboarding
  // multi-step BusinessSubmitWizard (required category/country/city Radix
  // selects, no test ids). Needs a dedicated wizard rewrite + test ids.
  test.fixme('VIP submits business profile', async ({ page, locale, seed }) => {
    const { phone } = await seed('vip-member');
    if (!phone) {
      test.skip();
      return;
    }

    // Sign in as VIP
    await signInMember(page, locale, phone);

    // Navigate to business tab
    const dashboard = new DashboardPage(page, locale);
    await dashboard.clickTab('business');

    // Fill business form
    const businessPage = new MyBusinessPage(page, locale);
    await businessPage.fillBusinessName('E2E Lifecycle Business');
    await businessPage.fillEmail('e2e-lifecycle@test.com');
    await businessPage.fillPhone('+10000000077');
    await businessPage.fillWebsite('https://e2e-test.com');
    await businessPage.submit();

    // Should show UNDER_REVIEW status
    await expect(page.locator('[data-testid="business-status"]')).toContainText(/under.?review/i);
  });

  // FIXME(e2e-auth-flow-stale): admin sign-in migrated to phone+password+TOTP;
  // this still drives the removed admin OTP flow. Tracked separately.
  test.fixme('staff approves business in admin', async ({ browser, seed }) => {
    const { businessId } = await seed('vip-with-business');
    const { staffPhone } = await seed('staff-owner');
    if (!businessId || !staffPhone) {
      test.skip();
      return;
    }

    // Open admin-app in a separate context
    const context = await browser.newContext({ baseURL: 'http://localhost:3001' });
    const adminPage = await context.newPage();

    // Sign in as staff
    await adminPage.goto('/auth/sign-in');
    await adminPage.locator('[data-testid="admin-phone-input"]').fill(staffPhone);
    await adminPage.locator('[data-testid="admin-submit-phone"]').click();
    await adminPage.locator('[data-testid="admin-otp-input"]').fill(DEV_OTP_CODE);
    await adminPage.locator('[data-testid="admin-submit-otp"]').click();

    // Handle TOTP
    await expect(adminPage).toHaveURL(/.*\/auth\/(2fa-required|totp-setup).*/, { timeout: 30000 });
    await adminPage.locator('[data-testid="admin-totp-input"]').fill(DEV_TOTP_CODE);
    await adminPage.locator('[data-testid="admin-submit-totp"]').click();
    await expect(adminPage).toHaveURL(/.*\/dashboard.*/, { timeout: 30000 });

    // Navigate to businesses
    const adminBusinesses = new AdminBusinessesPage(adminPage);
    await adminBusinesses.goto();

    // Approve the business
    await adminBusinesses.approveBusinessById(businessId);

    await context.close();
  });

  test('public directory shows published business', async ({ page, locale, seed }) => {
    const { businessSlug } = await seed('vip-with-published-business');
    if (!businessSlug) {
      test.skip();
      return;
    }

    const directoryPage = new DirectoryPage(page, locale);
    await directoryPage.goto();

    // The published business should appear in the directory
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('E2E Published Business');
  });
});
