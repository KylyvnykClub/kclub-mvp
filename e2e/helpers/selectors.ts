/**
 * Shared selectors used across E2E page objects.
 * Updated to use DOM locators since data-testids are not present on all elements.
 */
export const SELECTORS = {
  // Navigation
  NAV_LOGO: 'a[href="/"], a[href^="/en"]',
  NAV_SIGN_IN: 'a[href$="/sign-in"]',
  NAV_SIGN_UP: 'a[href$="/sign-up"]',
  NAV_DASHBOARD: 'a[href$="/dashboard"]',

  // Home page
  HOME_HERO: 'section',
  HOME_FEATURED_TOP: 'section',
  HOME_FEATURED_RECOMMENDED: 'section',

  // Directory
  DIRECTORY_LIST: 'ul, .grid, [class*="grid"]',
  DIRECTORY_CARD: 'a[href*="/directory/"]',
  DIRECTORY_SEARCH: 'input[type="search"], input[placeholder*="earch"]',

  // Business detail
  BUSINESS_NAME: 'h1',
  BUSINESS_CATEGORY: 'h2, h3, h4',
  BUSINESS_CONTACT: 'a[href^="tel:"], a[href^="mailto:"]',

  // Card verification
  CARD_VERIFY_STATUS: 'body',
  CARD_VERIFY_NAME: 'body',
  CARD_VERIFY_ERROR: 'body',

  // Auth
  AUTH_PHONE_INPUT: 'input[name="phone"], input[type="tel"]',
  AUTH_OTP_INPUT: 'input[name="otp"], input[name="code"]',
  AUTH_SUBMIT_PHONE: 'button[type="submit"]',
  AUTH_SUBMIT_OTP: 'button[type="submit"]',
  AUTH_TERMS_CHECKBOX: '[data-testid="auth-terms-checkbox"]',

  // Onboarding
  ONBOARDING_DISPLAY_NAME: 'input[name="displayName"], input[name="name"]',
  ONBOARDING_LOCALE_SELECT: 'select[name="locale"], button[role="combobox"]',
  ONBOARDING_TERMS_CHECKBOX: 'input[type="checkbox"], button[role="checkbox"]',
  ONBOARDING_SUBMIT: 'button[type="submit"]',

  // Dashboard
  DASHBOARD_TAB_DETAILS: 'a[href*="tab=details"]',
  DASHBOARD_TAB_CARD: 'a[href*="tab=card"]',
  DASHBOARD_TAB_SUBSCRIPTION: 'a[href*="tab=subscription"]',
  DASHBOARD_TAB_AUDIT: 'a[href*="tab=audit"]',
  DASHBOARD_TAB_PERMISSIONS: 'a[href*="tab=permissions"]',
  DASHBOARD_TAB_SETTINGS: 'a[href*="tab=settings"]',
  // Legacy aliases
  DASHBOARD_TAB_ACCOUNT: 'a[href*="tab=details"], a[href*="tab=account"]',
  DASHBOARD_TAB_CATALOG: 'a[href$="/dashboard/catalog"], a[href*="tab=catalog"]',
  DASHBOARD_TAB_BUSINESS: 'a[href*="tab=business"]',
  DASHBOARD_TAB_INTRODUCTIONS: 'a[href*="tab=introductions"]',
  DASHBOARD_TAB_PROFILE: 'a[href*="tab=details"], a[href*="tab=profile"]',

  // Card display
  CARD_NUMBER: 'body',
  CARD_QR_CODE: 'svg, img',
  CARD_STATUS: 'body',

  // Business form
  BUSINESS_FORM: 'form',
  BUSINESS_FORM_NAME: 'input[name="name"]',
  BUSINESS_FORM_EMAIL: 'input[name="email"], input[name="representative_email"]',
  BUSINESS_FORM_PHONE: 'input[name="phone"], input[name="representative_phone"]',
  BUSINESS_FORM_CATEGORY: 'select, button[role="combobox"]',
  BUSINESS_FORM_WEBSITE: 'input[name="website"]',
  BUSINESS_FORM_SUBMIT: 'button[type="submit"]',
  BUSINESS_STATUS: 'body',

  // Introduction form
  INTRO_FORM: 'form',
  INTRO_TARGET_BUSINESS: 'input[name="targetBusinessId"], select',
  INTRO_MESSAGE: 'textarea[name="message"]',
  INTRO_SUBMIT: 'button[type="submit"]',
  INTRO_STATUS: 'body',

  // Subscription
  SUBSCRIPTION_STATUS: 'body',
  SUBSCRIPTION_UPGRADE_BTN: 'a[href*="/checkout"], button',
  SUBSCRIPTION_TIER: 'body',

  // Admin
  ADMIN_PHONE_INPUT: '[data-testid="admin-phone-input"], input[name="phone"]',
  ADMIN_OTP_INPUT: '[data-testid="admin-otp-input"], input[name="code"]',
  ADMIN_TOTP_INPUT: '[data-testid="admin-totp-input"], input[name="code"]',
  ADMIN_SUBMIT_PHONE: '[data-testid="admin-submit-phone"], button[type="submit"]',
  ADMIN_SUBMIT_OTP: '[data-testid="admin-submit-otp"], button[type="submit"]',
  ADMIN_SUBMIT_TOTP: '[data-testid="admin-submit-totp"], button[type="submit"]',
  ADMIN_SIDEBAR: 'nav, aside',
  ADMIN_BUSINESSES_TABLE: 'table',
  ADMIN_BUSINESS_APPROVE_BTN: 'button, a',
  ADMIN_BUSINESS_REJECT_BTN: 'button, a',
  ADMIN_INTRODUCTIONS_TABLE: 'table',
  ADMIN_INTRO_APPROVE_BTN: 'button, a',
  ADMIN_INTRO_REJECT_BTN: 'button, a',
} as const;

export type SelectorKey = keyof typeof SELECTORS;
