export const API_BASE_PATH = '/api/v1' as const;
export const ADMIN_API_BASE_PATH = '/api/admin/v1' as const;

export const MEMBER_API_ROUTES = {
  AUTH_SIGN_UP: `${API_BASE_PATH}/auth/sign-up`,
  AUTH_SIGN_UP_VERIFY: `${API_BASE_PATH}/auth/sign-up/verify`,
  AUTH_SIGN_IN: `${API_BASE_PATH}/auth/sign-in`,
  AUTH_PASSWORD_RECOVERY: `${API_BASE_PATH}/auth/password-recovery`,
  AUTH_PASSWORD_RECOVERY_VERIFY: `${API_BASE_PATH}/auth/password-recovery/verify`,
  AUTH_LOGOUT: `${API_BASE_PATH}/auth/logout`,
  ME: `${API_BASE_PATH}/me`,
  COMPLETE_ONBOARDING: `${API_BASE_PATH}/me/complete-onboarding`,
  SKIP_ONBOARDING: `${API_BASE_PATH}/me/skip-onboarding`,
  CARDS: `${API_BASE_PATH}/cards`,
  CARD_VERIFY: `${API_BASE_PATH}/cards/verify/:cardNumber`,
  TAXONOMY_CITIES: `${API_BASE_PATH}/taxonomy/cities`,
  BUSINESSES: `${API_BASE_PATH}/businesses`,
  BUSINESS_DETAIL: `${API_BASE_PATH}/businesses/:id`,
  BUSINESS_CHECKOUT_PLACEMENT: `${API_BASE_PATH}/businesses/:id/checkout-placement`,
  INTRODUCTIONS: `${API_BASE_PATH}/introductions`,
  INTRODUCTION_CANCEL: `${API_BASE_PATH}/introductions/:id/cancel`,
  BUSINESS_INTRODUCTIONS_INCOMING: `${API_BASE_PATH}/me/business/introductions`,
  BUSINESS_INTRODUCTION_REVIEW: `${API_BASE_PATH}/me/business/introductions/:id/review`,
  BUSINESS_INTRODUCTION_APPROVE: `${API_BASE_PATH}/me/business/introductions/:id/approve`,
  BUSINESS_INTRODUCTION_REJECT: `${API_BASE_PATH}/me/business/introductions/:id/reject`,
  SUBSCRIPTIONS: `${API_BASE_PATH}/subscriptions`,
  SUBSCRIPTION_CHECKOUT: `${API_BASE_PATH}/subscriptions/checkout`,
  SUBSCRIPTION_DETAIL: `${API_BASE_PATH}/subscriptions/:id`,
  SUBSCRIPTION_CANCEL: `${API_BASE_PATH}/subscriptions/:id/cancel`,
} as const;

export const ADMIN_API_ROUTES = {
  DASHBOARD_METRICS: `${ADMIN_API_BASE_PATH}/dashboard-metrics`,
  STAFF_AUTH_PASSWORD_REGISTER: `${ADMIN_API_BASE_PATH}/staff-auth/password/register`,
  STAFF_AUTH_PASSWORD_SIGN_IN: `${ADMIN_API_BASE_PATH}/staff-auth/password/sign-in`,
  STAFF_AUTH_SESSION: `${ADMIN_API_BASE_PATH}/staff-auth/session`,
  STAFF_AUTH_LOGOUT: `${ADMIN_API_BASE_PATH}/staff-auth/logout`,
  USERS: `${ADMIN_API_BASE_PATH}/users`,
  USER_DETAIL: `${ADMIN_API_BASE_PATH}/users/:id`,
  USER_INVOICES: `${ADMIN_API_BASE_PATH}/users/:id/invoices`,
  USER_BLOCK: `${ADMIN_API_BASE_PATH}/users/:id/block`,
  USER_UNBLOCK: `${ADMIN_API_BASE_PATH}/users/:id/unblock`,
  CARDS: `${ADMIN_API_BASE_PATH}/cards`,
  CARD_DETAIL: `${ADMIN_API_BASE_PATH}/cards/:id`,
  CARD_REVOKE: `${ADMIN_API_BASE_PATH}/cards/:id/revoke`,
  CARD_REISSUE: `${ADMIN_API_BASE_PATH}/cards/:id/reissue`,
  BUSINESSES: `${ADMIN_API_BASE_PATH}/businesses`,
  BUSINESS_DETAIL: `${ADMIN_API_BASE_PATH}/businesses/:id`,
  BUSINESS_APPROVE: `${ADMIN_API_BASE_PATH}/businesses/:id/approve`,
  BUSINESS_REJECT: `${ADMIN_API_BASE_PATH}/businesses/:id/reject`,
  BUSINESS_HIDE: `${ADMIN_API_BASE_PATH}/businesses/:id/hide`,
  BUSINESS_FEATURED: `${ADMIN_API_BASE_PATH}/businesses/:id/featured`,
  INTRODUCTIONS: `${ADMIN_API_BASE_PATH}/introductions`,
  INTRODUCTION_DETAIL: `${ADMIN_API_BASE_PATH}/introductions/:id`,
  INTRODUCTION_APPROVE: `${ADMIN_API_BASE_PATH}/introductions/:id/approve`,
  INTRODUCTION_REJECT: `${ADMIN_API_BASE_PATH}/introductions/:id/reject`,
  INTRODUCTION_COMPLETE: `${ADMIN_API_BASE_PATH}/introductions/:id/complete`,
  CATEGORIES: `${ADMIN_API_BASE_PATH}/categories`,
  CATEGORY_DETAIL: `${ADMIN_API_BASE_PATH}/categories/:id`,
  COUNTRIES: `${ADMIN_API_BASE_PATH}/countries`,
  COUNTRY_DETAIL: `${ADMIN_API_BASE_PATH}/countries/:id`,
  CITIES: `${ADMIN_API_BASE_PATH}/cities`,
  CITY_DETAIL: `${ADMIN_API_BASE_PATH}/cities/:id`,
  SUBSCRIPTIONS: `${ADMIN_API_BASE_PATH}/subscriptions`,
  SUBSCRIPTION_DETAIL: `${ADMIN_API_BASE_PATH}/subscriptions/:id`,
  SUBSCRIPTION_CANCEL: `${ADMIN_API_BASE_PATH}/subscriptions/:id/cancel`,
  STRIPE_PRICES: `${ADMIN_API_BASE_PATH}/stripe-prices`,
  ADMIN_CONFIG: `${ADMIN_API_BASE_PATH}/admin-config/:key`,
  STAFF: `${ADMIN_API_BASE_PATH}/staff`,
  STAFF_PERMISSIONS: `${ADMIN_API_BASE_PATH}/staff/:id/permissions`,
  STAFF_PASSWORD_RESET: `${ADMIN_API_BASE_PATH}/staff/:id/password-reset`,
  AUDIT: `${ADMIN_API_BASE_PATH}/audit`,
  WEBHOOK_REPLAY: `${ADMIN_API_BASE_PATH}/webhooks/:eventId/replay`,
} as const;

export type MemberApiRouteKey = keyof typeof MEMBER_API_ROUTES;
export type AdminApiRouteKey = keyof typeof ADMIN_API_ROUTES;
export type ApiRoutePattern =
  (typeof MEMBER_API_ROUTES)[MemberApiRouteKey] | (typeof ADMIN_API_ROUTES)[AdminApiRouteKey];

export function buildApiRoute(
  pattern: ApiRoutePattern,
  params: Record<string, string | number>,
): string {
  return Object.entries(params).reduce<string>(
    (path, [key, value]) => path.replace(`:${key}`, encodeURIComponent(String(value))),
    pattern,
  );
}
