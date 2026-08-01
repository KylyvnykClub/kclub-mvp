import { test, expect } from '../fixtures/base';
import { SignUpPage } from '../page-objects/sign-up.page';
import { OnboardingPage } from '../page-objects/onboarding.page';
import { DashboardPage } from '../page-objects/dashboard.page';
import { DEV_OTP_CODE } from '../helpers/mock-otp';
import { DEV_PASSWORD, signInMember } from '../helpers/auth';

test.describe('Member journey', () => {
  test('sign-up with phone OTP and complete onboarding', async ({ page, locale }) => {
    const signUpPage = new SignUpPage(page, locale);
    await signUpPage.goto();

    // Enter phone + password, accept terms (required checkbox blocks native form
    // submission otherwise), and submit the credentials step
    await signUpPage.fillPhone('+10000000099');
    await signUpPage.fillPassword(DEV_PASSWORD);
    await signUpPage.acceptTerms();
    await signUpPage.submitPhone();

    // Enter OTP code
    await signUpPage.fillOtp(DEV_OTP_CODE);
    await signUpPage.submitOtp();

    // Should redirect to onboarding
    await expect(page).toHaveURL(new RegExp(`.*/${locale}/m/onboarding.*`), { timeout: 30000 });

    // Complete onboarding — the form only collects a display name (locale
    // defaults from the URL, terms are implicitly accepted on submit)
    const onboardingPage = new OnboardingPage(page, locale);
    await onboardingPage.fillDisplayName('E2E Test User');
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

    // Sign in with seeded member
    await signInMember(page, locale, phone);

    // Account tab is the default and includes the club card
    await expect(page.locator('[data-testid="card-number"]')).toBeVisible();
  });

  test('dashboard shows correct tabs for MEMBER tier', async ({ page, locale, seed }) => {
    const { phone } = await seed('member-with-card');
    if (!phone) {
      test.skip();
      return;
    }

    await signInMember(page, locale, phone);

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
