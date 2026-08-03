import type { Page, Locator } from '@playwright/test';

/**
 * Admin staff sign-in — phone + password. The bootstrap owner goes straight to
 * /dashboard (no TOTP). DB-backed staff would then hit /auth/mfa; completeTotp
 * is kept for a future TOTP-flow test.
 */
export class AdminSignInPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/sign-in');
  }

  async signIn(phone: string, password: string): Promise<void> {
    await this.page.goto('/auth/sign-in');
    await this.page.locator('[data-testid="admin-phone-input"]').fill(phone);
    await this.page.locator('[data-testid="admin-password-input"]').fill(password);
    await this.page.locator('[data-testid="admin-submit-sign-in"]').click();
  }

  async completeTotp(code: string): Promise<void> {
    await this.page.locator('[data-testid="admin-totp-input"]').fill(code);
    await this.page.locator('[data-testid="admin-submit-totp"]').click();
  }
}
