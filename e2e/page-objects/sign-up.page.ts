import type { Page, Locator } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';

export class SignUpPage {
  private readonly page: Page;
  private readonly locale: string;

  constructor(page: Page, locale = 'en') {
    this.page = page;
    this.locale = locale;
  }

  async goto(): Promise<void> {
    await this.page.goto(`/${this.locale}/sign-up`);
  }

  async fillPhone(phone: string): Promise<void> {
    await this.page.locator(SELECTORS.AUTH_PHONE_INPUT).first().fill(phone);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.locator('[data-testid="auth-password-input"]').first().fill(password);
  }

  async acceptTerms(): Promise<void> {
    await this.page.locator(SELECTORS.AUTH_TERMS_CHECKBOX).first().check();
  }

  async submitPhone(): Promise<void> {
    await this.page.locator(SELECTORS.AUTH_SUBMIT_PHONE).first().click();
  }

  async fillOtp(code: string): Promise<void> {
    await this.page.locator(SELECTORS.AUTH_OTP_INPUT).first().fill(code);
  }

  async submitOtp(): Promise<void> {
    await this.page.locator(SELECTORS.AUTH_SUBMIT_OTP).first().click();
  }
}
