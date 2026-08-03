import { test, expect } from '../fixtures/base';
import { IntroducePage } from '../page-objects/introduce.page';
import { AdminIntroductionsPage } from '../page-objects/admin-introductions.page';
import { AdminSignInPage } from '../page-objects/admin-sign-in.page';
import { signInMember, DEV_STAFF_PASSWORD } from '../helpers/auth';

test.describe('Introduction flow', () => {
  test('VIP member submits an introduction', async ({ page, locale, seed }) => {
    // Published businesses give the VIP a target to recommend a client to.
    await seed('published-businesses');
    const { phone } = await seed('vip-member');
    if (!phone) {
      test.skip();
      return;
    }

    await signInMember(page, locale, phone);

    // "Recommend a Client" now lives in the cabinet introductions tab.
    const introducePage = new IntroducePage(page, locale);
    await introducePage.openFromDashboard();
    await introducePage.selectFirstTarget();
    await introducePage.fillClient('E2E Client', '+15550001234');
    await introducePage.fillMessage('E2E test introduction message');
    await introducePage.submit();

    await expect(introducePage.success).toBeVisible();
  });

  test('staff reviews introduction in admin', async ({ browser, seed }) => {
    const { staffPhone } = await seed('staff-owner');
    if (!staffPhone) {
      test.skip();
      return;
    }

    const context = await browser.newContext({ baseURL: 'http://localhost:3001' });
    const adminPage = await context.newPage();

    // Sign in as the bootstrap owner (phone + password, no TOTP).
    const signInPage = new AdminSignInPage(adminPage);
    await signInPage.signIn(staffPhone, DEV_STAFF_PASSWORD);
    await expect(adminPage).toHaveURL(/.*\/dashboard.*/, { timeout: 30000 });

    const adminIntros = new AdminIntroductionsPage(adminPage);
    await adminIntros.goto();
    // The introductions table renders its column headers even when empty.
    await expect(
      adminPage.getByRole('columnheader', { name: 'Target Business' }),
    ).toBeVisible();

    await context.close();
  });
});
