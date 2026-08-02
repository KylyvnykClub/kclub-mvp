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
    // The implemented member cabinet tabs (see IMPLEMENTED_MEMBER_DASHBOARD_TABS).
    const tabs = ['details', 'business', 'recommendations', 'introductions', 'settings'];
    const visibleTabs: string[] = [];

    // Every member sees the details tab; wait for it so the tab bar has
    // hydrated before probing the rest with the non-waiting isVisible().
    await this.getTab('details').waitFor({ state: 'visible', timeout: 15_000 });

    for (const tab of tabs) {
      if (await this.getTab(tab).isVisible()) {
        visibleTabs.push(tab);
      }
    }

    return visibleTabs;
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
