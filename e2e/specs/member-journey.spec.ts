import { test, expect } from '../fixtures/base';
import { SignUpPage } from '../page-objects/sign-up.page';
import { OnboardingPage } from '../page-objects/onboarding.page';
import { DashboardPage } from '../page-objects/dashboard.page';
import { DEV_OTP_CODE } from '../helpers/mock-otp';
import { setupMemberAuthMocks } from '../helpers/mock-otp';

test.describe('Member journey', () => {
  test('sign-up with phone OTP and complete onboarding', async ({ page, locale }) => {
    await setupMemberAuthMocks(page);

    const signUpPage = new SignUpPage(page, locale);
    await signUpPage.goto();

    // Enter phone and submit
    await signUpPage.fillPhone('+10000000099');
    await signUpPage.submitPhone();

    // Enter OTP code
    await signUpPage.fillOtp(DEV_OTP_CODE);
    await signUpPage.submitOtp();

    // Should redirect to onboarding
    await expect(page).toHaveURL(new RegExp(`.*/${locale}/m/onboarding.*`), { timeout: 30000 });

    // Complete onboarding
    const onboardingPage = new OnboardingPage(page, locale);
    await onboardingPage.fillDisplayName('E2E Test User');
    await onboardingPage.selectLocale('en');
    await onboardingPage.acceptTerms();
    await onboardingPage.submit();

    // Should redirect to dashboard after onboarding
    await expect(page).toHaveURL(new RegExp(`.*/${locale}/m/dashboard.*`), { timeout: 30000 });
  });

  test('card display on dashboard after onboarding', async ({ page, locale, seed }) => {
    // Use pre-seeded member with card for this test
    const { phone, cardNumber } = await seed('member-with-card');
    if (!phone) {
      test.skip();
      return;
    }

    await setupMemberAuthMocks(page);

    // Sign in with seeded member
    await page.goto(`/${locale}/sign-in`);
    await page.locator('[data-testid="auth-phone-input"]').fill(phone);
    await page.locator('[data-testid="auth-submit-phone"]').click();
    await page.waitForSelector('[data-testid="auth-otp-input"]');
    await page.locator('[data-testid="auth-otp-input"]').fill(DEV_OTP_CODE);
    await page.locator('[data-testid="auth-submit-otp"]').click();

    await expect(page).toHaveURL(new RegExp(`.*/${locale}/m/dashboard.*`), { timeout: 30000 });

    // Account tab is the default and includes the club card
    await expect(page.locator('[data-testid="card-number"]')).toBeVisible();
  });

  test('dashboard shows correct tabs for MEMBER tier', async ({ page, locale, seed }) => {
    const { phone } = await seed('member-with-card');
    if (!phone) {
      test.skip();
      return;
    }

    await setupMemberAuthMocks(page);

    await page.goto(`/${locale}/sign-in`);
    await page.locator('[data-testid="auth-phone-input"]').fill(phone);
    await page.locator('[data-testid="auth-submit-phone"]').click();
    await page.waitForSelector('[data-testid="auth-otp-input"]');
    await page.locator('[data-testid="auth-otp-input"]').fill(DEV_OTP_CODE);
    await page.locator('[data-testid="auth-submit-otp"]').click();
    await expect(page).toHaveURL(new RegExp(`.*/${locale}/m/dashboard.*`), { timeout: 30000 });

    const dashboard = new DashboardPage(page, locale);
    const visibleTabs = await dashboard.getVisibleTabNames();

    expect(visibleTabs).toContain('details');
    expect(visibleTabs).toContain('card');
    expect(visibleTabs).toContain('subscription');
    expect(visibleTabs).toContain('settings');
    expect(visibleTabs).not.toContain('audit');
    expect(visibleTabs).not.toContain('permissions');
  });
});
