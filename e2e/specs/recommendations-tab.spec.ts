import { test, expect } from '../fixtures/base';
import { DEV_OTP_CODE } from '../helpers/mock-otp';
import { waitForNavigation } from '../helpers/wait-for';

test.describe('Recommendations tab', () => {
  test('business owner sees an APPROVED incoming recommendation with actions', async ({
    page,
    locale,
    seed,
  }) => {
    const { phone } = await seed('business-with-incoming-introduction');
    if (!phone) {
      test.skip();
      return;
    }

    // Sign in as the business owner (mock-supabase resolves phone -> auth user).
    await page.goto(`/${locale}/sign-in`);
    await page.locator('[data-testid="auth-phone-input"]').fill(phone);
    await page.locator('[data-testid="auth-submit-phone"]').click();

    await page.waitForSelector('[data-testid="auth-otp-input"]');
    await page.locator('[data-testid="auth-otp-input"]').fill(DEV_OTP_CODE);
    await page.locator('[data-testid="auth-submit-otp"]').click();

    await waitForNavigation(page, new RegExp(`/${locale}/m/dashboard`));

    // The recommendations tab is only visible to members that own a business.
    const recommendationsTab = page.getByRole('tab', { name: 'Incoming Recommendations' });
    await expect(recommendationsTab).toBeVisible();
    await recommendationsTab.click();

    // Seeded introduction renders inside the now-active panel.
    await expect(page.getByText('E2E Client Name')).toBeVisible();
    await expect(page.getByText('E2E incoming recommendation message')).toBeVisible();

    // APPROVED status exposes the owner's Complete / Decline actions.
    await expect(page.getByRole('button', { name: 'Complete' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible();

    await page.screenshot({ path: 'e2e/artifacts/recommendations-tab.png', fullPage: true });
  });
});
