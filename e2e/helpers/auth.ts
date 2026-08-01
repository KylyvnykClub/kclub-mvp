import type { Page } from '@playwright/test';

/**
 * Any password works for seeded members: the e2e mock-supabase password grant
 * ignores the value and resolves the session by phone. A real-looking value
 * keeps the client-side minLength(6) validation happy.
 */
export const DEV_PASSWORD = 'e2e-Password-123';

/**
 * Signs in an existing seeded member via the phone + password flow.
 *
 * Sign-in is entirely server-side: the browser POSTs to /api/v1/auth/sign-in,
 * which calls supabase.auth.signInWithPassword against the build-time
 * NEXT_PUBLIC_SUPABASE_URL (the mock-supabase route). Seeded members set
 * display_name + locale_preference + terms_accepted_at, so onboarding is
 * complete and sign-in redirects to /m/dashboard.
 */
export async function signInMember(page: Page, locale: string, phone: string): Promise<void> {
  await page.goto(`/${locale}/sign-in`);
  await page.locator('[data-testid="auth-phone-input"]').fill(phone);
  await page.locator('[data-testid="auth-password-input"]').fill(DEV_PASSWORD);
  await page.locator('[data-testid="auth-submit"]').click();
  await page.waitForURL(new RegExp(`/${locale}/m/(dashboard|onboarding)`), { timeout: 30_000 });
}
