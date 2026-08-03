import { test, expect } from '../fixtures/base';
import { signInMember } from '../helpers/auth';
import { simulateVipCheckoutComplete } from '../helpers/mock-stripe';

test.describe('Billing flow', () => {
  test('VIP upgrade starts checkout from the account tab', async ({ page, locale, seed }) => {
    const { phone, userId } = await seed('member-with-card');
    if (!phone || !userId) {
      test.skip();
      return;
    }

    const successUrl = `http://localhost:3000/${locale}/m/checkout/success`;
    // The upgrade button fetches our checkout API from the browser, which would
    // hit real Stripe server-side. Intercept that client fetch and return a
    // checkoutUrl so no Stripe key is needed in CI.
    await page.route('**/api/v1/subscriptions/checkout*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { checkoutUrl: successUrl }, error: null }),
      }),
    );

    await signInMember(page, locale, phone);

    // Upgrade button lives on the default (details) tab.
    const upgrade = page.locator('[data-testid="vip-upgrade-btn"]');
    await expect(upgrade).toBeVisible();
    await upgrade.click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/m/checkout/success`), { timeout: 30000 });
  });

  test('account tab shows VIP after checkout webhook', async ({ page, locale, seed }) => {
    const { phone, userId } = await seed('member-with-card');
    if (!phone || !userId) {
      test.skip();
      return;
    }

    // Apply the VIP subscription via the mocked checkout webhook, then sign in.
    await simulateVipCheckoutComplete(userId);
    await signInMember(page, locale, phone);

    await expect(page.locator('[data-testid="subscription-status"]')).toContainText(/vip/i);
  });
});
