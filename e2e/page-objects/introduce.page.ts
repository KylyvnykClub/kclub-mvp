import type { Page, Locator } from '@playwright/test';

/**
 * The "Recommend a Client" flow lives in the member cabinet `introductions`
 * tab (visible to VIP members without a business), not the old `/m/introduce`
 * route (now a redirect stub).
 */
export class IntroducePage {
  private readonly page: Page;
  private readonly locale: string;

  constructor(page: Page, locale = 'en') {
    this.page = page;
    this.locale = locale;
  }

  async openFromDashboard(): Promise<void> {
    await this.page.goto(`/${this.locale}/m/dashboard`);
    await this.page.getByRole('tab', { name: 'Recommend a Client' }).click();
  }

  async selectFirstTarget(): Promise<void> {
    await this.page.locator('[data-testid="intro-target-business"]').click();
    await this.page.getByRole('option').first().click();
  }

  async fillClient(name: string, phone: string): Promise<void> {
    await this.page.locator('[data-testid="intro-client-name"]').fill(name);
    await this.page.locator('[data-testid="intro-client-phone"]').fill(phone);
  }

  async fillMessage(msg: string): Promise<void> {
    await this.page.locator('[data-testid="intro-message"]').fill(msg);
  }

  async submit(): Promise<void> {
    await this.page.locator('[data-testid="intro-submit"]').click();
  }

  get success(): Locator {
    return this.page.locator('[data-testid="intro-submit-success"]');
  }
}
