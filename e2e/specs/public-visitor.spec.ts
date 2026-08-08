import { test, expect } from '../fixtures/base';
import { HomePage } from '../page-objects/home.page';
import { DirectoryPage } from '../page-objects/directory.page';
import { CardVerifyPage } from '../page-objects/card-verify.page';

test.describe('Public visitor paths', () => {
  test('home page renders with hero and navigation', async ({ page, locale }) => {
    const homePage = new HomePage(page, locale);
    await homePage.goto();

    await expect(homePage.hero).toBeVisible();
    await expect(homePage.navigation).toBeVisible();
    await expect(homePage.footer).toBeVisible();
  });

  test('directory lists published businesses', async ({ page, locale, seed }) => {
    await seed('published-businesses');

    const directoryPage = new DirectoryPage(page, locale);
    await directoryPage.goto();

    const cards = directoryPage.businessCards;
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('business detail page renders', async ({ page, locale, seed }) => {
    const { businessSlug } = await seed('published-businesses');
    if (!businessSlug) {
      test.skip();
      return;
    }

    const directoryPage = new DirectoryPage(page, locale);
    await directoryPage.goto();
    await page.locator(`a[href$="/${locale}/directory/${businessSlug}"]`).first().click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/directory/${businessSlug}$`), {
      timeout: 30000,
    });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('card verification shows valid card status', async ({ page, locale, seed }) => {
    const { cardNumber } = await seed('member-with-card');
    if (!cardNumber) {
      test.skip();
      return;
    }

    const cardVerifyPage = new CardVerifyPage(page, locale);
    await cardVerifyPage.goto(cardNumber);

    await expect(cardVerifyPage.status).toBeVisible();
    await expect(cardVerifyPage.status).toContainText(/active/i);
  });

  test('card verification handles invalid card gracefully', async ({ page, locale }) => {
    const cardVerifyPage = new CardVerifyPage(page, locale);
    await cardVerifyPage.goto('INVALID-000000');

    await expect(cardVerifyPage.errorMessage).toBeVisible();
  });
});
