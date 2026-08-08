import type { Page } from '@playwright/test';

const PRODUCT_CORE_BASE = 'http://localhost:3000';
const E2E_TEST_SECRET = process.env.E2E_TEST_SECRET ?? 'e2e-test-secret-local';

/**
 * Intercepts Stripe Checkout redirect to prevent navigating to stripe.com.
 * Instead, simulates a successful checkout by redirecting to the success URL.
 */
export async function interceptStripeCheckout(page: Page, successUrl: string): Promise<void> {
  await page.route('**/checkout.stripe.com/**', (route) => {
    return route.fulfill({
      status: 302,
      headers: { Location: successUrl },
    });
  });

  // Also intercept the Stripe checkout session creation API
  // to capture the session ID for webhook simulation
  await page.route('**/api.stripe.com/**', (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'cs_e2e_mock_session',
        url: successUrl,
      }),
    });
  });
}

/**
 * Simulates a Stripe webhook event by posting directly to the test seed endpoint.
 * This bypasses Stripe signature verification for E2E tests.
 */
export async function simulateStripeWebhook(
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(`${PRODUCT_CORE_BASE}/api/v1/test/seed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-e2e-secret': E2E_TEST_SECRET,
    },
    body: JSON.stringify({
      scenario: 'stripe-webhook',
      webhookEvent: {
        type: eventType,
        data: { object: payload },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Stripe webhook simulation failed: ${response.status}`);
  }
}

/**
 * Simulates a successful VIP subscription checkout webhook.
 */
export async function simulateVipCheckoutComplete(
  userId: string,
  subscriptionId?: string,
): Promise<void> {
  const safeUserId = userId.replace(/[^a-zA-Z0-9]/g, '');

  await simulateStripeWebhook('checkout.session.completed', {
    id: 'cs_e2e_mock',
    object: 'checkout.session',
    customer: 'cus_e2e_mock',
    subscription: subscriptionId ?? `sub_e2e_vip_${safeUserId}`,
    metadata: { userId, type: 'vip' },
  });
}

/**
 * Simulates a successful business placement checkout webhook.
 */
export async function simulateBusinessPlacementComplete(
  userId: string,
  businessProfileId: string,
): Promise<void> {
  const safeBusinessId = businessProfileId.replace(/[^a-zA-Z0-9]/g, '');

  await simulateStripeWebhook('checkout.session.completed', {
    id: 'cs_e2e_mock_placement',
    object: 'checkout.session',
    customer: 'cus_e2e_mock',
    subscription: `sub_e2e_placement_${safeBusinessId}`,
    metadata: { userId, businessProfileId, type: 'placement' },
  });
}

/**
 * Simulates the manual-capture payment intent event that finalizes
 * a business review reserve and creates the UNDER_REVIEW business profile.
 */
export async function simulateBusinessReviewReserveComplete(
  userId: string,
  pendingSubmissionId: string,
): Promise<void> {
  const safePendingSubmissionId = pendingSubmissionId.replace(/[^a-zA-Z0-9]/g, '');

  await simulateStripeWebhook('payment_intent.amount_capturable_updated', {
    id: `pi_e2e_business_review_${safePendingSubmissionId}`,
    object: 'payment_intent',
    amount_capturable: 2500,
    metadata: {
      type: 'business_review_reserve',
      userId,
      pendingSubmissionId,
    },
  });
}
