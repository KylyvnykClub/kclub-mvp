import { test, expect } from '../fixtures/base';
import { MyBusinessPage } from '../page-objects/my-business.page';
import { DirectoryPage } from '../page-objects/directory.page';
import { AdminBusinessesPage } from '../page-objects/admin-businesses.page';
import { AdminSignInPage } from '../page-objects/admin-sign-in.page';
import { signInMember, DEV_STAFF_PASSWORD } from '../helpers/auth';

test.describe('Business lifecycle', () => {
  test('VIP submits business profile', async ({ page, locale, seed }) => {
    const { phone } = await seed('vip-member');
    if (!phone) {
      test.skip();
      return;
    }

    const successUrl = `http://localhost:3000/${locale}/m/checkout/success`;
    await page.route('**/api/v1/businesses/reserve-review*', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: { checkoutUrl: successUrl }, error: null }),
      }),
    );

    await signInMember(page, locale, phone);

    const businessPage = new MyBusinessPage(page, locale);
    await businessPage.goto();

    await businessPage.fillBusinessName('E2E Lifecycle Business');
    await businessPage.selectSphere();
    await businessPage.selectCategoryGroup();
    await businessPage.selectCategory();
    await businessPage.continueStep();

    await businessPage.fillRepresentativeName('E2E Representative');
    await businessPage.fillEmail('e2e-lifecycle@test.com');
    await businessPage.fillPhone('+10000000077');
    await businessPage.continueStep();

    await businessPage.selectCountry();
    await businessPage.selectCity();
    await businessPage.fillWebsite('https://e2e-test.com');
    await businessPage.continueStep();

    await businessPage.acceptReviewTerms();
    await businessPage.submit();

    await expect(page).toHaveURL(new RegExp(`/${locale}/m/checkout/success`), { timeout: 30000 });
  });

  test('staff approves business in admin', async ({ browser, seed }) => {
    const { businessId } = await seed('vip-with-business');
    const { staffPhone } = await seed('staff-owner');
    if (!businessId || !staffPhone) {
      test.skip();
      return;
    }

    // Open admin-app in a separate context and sign in as the bootstrap owner
    // (phone + password, no TOTP).
    const context = await browser.newContext({ baseURL: 'http://localhost:3001' });
    const adminPage = await context.newPage();

    const signInPage = new AdminSignInPage(adminPage);
    await signInPage.signIn(staffPhone, DEV_STAFF_PASSWORD);
    await expect(adminPage).toHaveURL(/.*\/dashboard.*/, { timeout: 30000 });

    const adminBusinesses = new AdminBusinessesPage(adminPage);
    await adminBusinesses.goto();
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
