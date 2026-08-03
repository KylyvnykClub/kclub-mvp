import type { Page, Locator } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';

export class AdminIntroductionsPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/introductions');
  }

  get table(): Locator {
    return this.page.locator(SELECTORS.ADMIN_INTRODUCTIONS_TABLE).first();
  }

  async approveFirst(): Promise<void> {
    await this.page.locator(SELECTORS.ADMIN_INTRO_APPROVE_BTN).first().click();
  }

  async rejectFirst(): Promise<void> {
    await this.page.locator(SELECTORS.ADMIN_INTRO_REJECT_BTN).first().click();
  }
}
