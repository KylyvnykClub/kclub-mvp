import type { Page, Locator } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';

export class MyBusinessPage {
  private readonly page: Page;
  private readonly locale: string;

  constructor(page: Page, locale = 'en') {
    this.page = page;
    this.locale = locale;
  }

  async goto(): Promise<void> {
    await this.page.goto(`/${this.locale}/m/business/onboarding`);
  }

  async fillBusinessName(name: string): Promise<void> {
    await this.page.locator('[data-testid="business-wizard-name"]').fill(name);
  }

  async fillEmail(email: string): Promise<void> {
    await this.page.locator('[data-testid="business-wizard-representative-email"]').fill(email);
  }

  async fillPhone(phone: string): Promise<void> {
    await this.page.locator('#representativePhone').fill(phone);
  }

  async selectSphere(): Promise<void> {
    await this.page.locator('[data-testid="business-wizard-sphere"]').selectOption({ index: 1 });
  }

  async selectCategoryGroup(): Promise<void> {
    await this.page
      .locator('[data-testid="business-wizard-category-group"]')
      .selectOption({ index: 1 });
  }

  async selectCategory(categoryValue?: string): Promise<void> {
    const categorySelect = this.page.locator('[data-testid="business-wizard-category"]');
    if (categoryValue) {
      await categorySelect.selectOption(categoryValue);
      return;
    }

    await categorySelect.selectOption({ index: 1 });
  }

  async continueStep(): Promise<void> {
    await this.page.locator('[data-testid="business-wizard-continue"]').click();
  }

  async fillRepresentativeName(name: string): Promise<void> {
    await this.page.locator('[data-testid="business-wizard-representative-name"]').fill(name);
  }

  async selectCountry(): Promise<void> {
    await this.page.locator('[data-testid="business-wizard-country"]').selectOption({ index: 1 });
  }

  async selectCity(): Promise<void> {
    const citySelect = this.page.locator('[data-testid="business-wizard-city"]');
    await citySelect.waitFor({ state: 'visible' });
    await citySelect.selectOption({ index: 1 });
  }

  async fillWebsite(url: string): Promise<void> {
    await this.page.locator('[data-testid="business-wizard-website"]').fill(url);
  }

  async acceptReviewTerms(): Promise<void> {
    await this.page
      .locator('[data-testid="business-wizard-confirm-authority"]')
      .check({ force: true });
    await this.page.locator('[data-testid="business-wizard-accept-legal"]').check({ force: true });
  }

  async submit(): Promise<void> {
    await this.page.locator('[data-testid="business-wizard-submit"]').click();
  }

  get status(): Locator {
    return this.page.locator(SELECTORS.BUSINESS_STATUS).first();
  }
}
