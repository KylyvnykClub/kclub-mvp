import { test, expect } from '../fixtures/base';
import { signInMember } from '../helpers/auth';

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
    await signInMember(page, locale, phone);

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
