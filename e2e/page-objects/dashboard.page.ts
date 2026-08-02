import type { Page, Locator } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';

export class DashboardPage {
  private readonly page: Page;
  private readonly locale: string;

  constructor(page: Page, locale = 'en') {
    this.page = page;
    this.locale = locale;
  }

  async goto(): Promise<void> {
    await this.page.goto(`/${this.locale}/m/dashboard`);
  }

  // Cabinet tabs are Radix TabsTrigger (role="tab"); target them by their
  // accessible label (the reliable selector — data-testid does not surface on
  // the Radix trigger). Labels are the en messages (e2e default locale).
  private tabLabel(tabName: string): string {
    switch (tabName) {
      case 'details':
      case 'account':
      case 'profile':
        return 'Account';
      case 'card':
        return 'Card';
      case 'subscription':
        return 'Subscription';
      case 'business':
        return 'Business';
      case 'recommendations':
        return 'Incoming Recommendations';
      case 'introductions':
        return 'Recommend a Client';
      case 'settings':
        return 'Settings';
      default:
        return tabName;
    }
  }

  getTab(tabName: string): Locator {
    return this.page.getByRole('tab', { name: this.tabLabel(tabName) }).first();
  }

  async clickTab(tabName: string): Promise<void> {
    await this.getTab(tabName).click();
  }

  async getVisibleTabNames(): Promise<string[]> {
    // Wait for the tab bar to hydrate, then read every rendered tab at once and
    // map its label back to the tab key (more robust than probing each key).
    await this.getTab('details').waitFor({ state: 'visible', timeout: 15_000 });

    const labelToKey: Record<string, string> = {
      Account: 'details',
      Card: 'card',
      Subscription: 'subscription',
      Business: 'business',
      'Incoming Recommendations': 'recommendations',
      'Recommend a Client': 'introductions',
      Settings: 'settings',
    };

    const labels = await this.page.getByRole('tab').allInnerTexts();
    return labels.map((label) => labelToKey[label.trim()]).filter((key): key is string => !!key);
  }

  get cardNumber(): Locator {
    return this.page.locator(SELECTORS.CARD_NUMBER).first();
  }

  get cardQr(): Locator {
    return this.page.locator(SELECTORS.CARD_QR_CODE).first();
  }

  get subscriptionStatus(): Locator {
    return this.page.locator(SELECTORS.SUBSCRIPTION_STATUS).first();
  }
}
