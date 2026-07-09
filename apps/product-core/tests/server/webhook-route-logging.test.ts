import { describe, expect, test, mock } from 'bun:test';

const mockLogError = mock();
const mockLogWebhook = mock();

mock.module('@/server/logger', () => ({
  createLogger: () => ({
    info: mock(),
    warn: mock(),
    error: mockLogError,
    debug: mock(),
    auth: mock(),
    webhook: mockLogWebhook,
    cron: mock(),
    admin: mock(),
  }),
}));

mock.module('@/server/stripe/client', () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent: mock(() => ({
        id: 'evt_test_123',
        type: 'customer.subscription.updated',
      })),
    },
  }),
}));

mock.module('@/server/stripe/env', () => ({
  readStripeEnv: () => ({ STRIPE_WEBHOOK_SECRET: 'whsec_test' }),
}));

const mockProcessStripeEvent = mock(async () => {});

// mock.module leaks across test files in the same bun process; spread the real
// module so other suites importing named exports keep seeing them
const realWebhookService = await import('../../src/server/services/webhook-service');

mock.module('@/server/services/webhook-service', () => ({
  ...realWebhookService,
  processStripeEvent: mockProcessStripeEvent,
}));

const { POST } = await import('../../src/app/api/stripe/webhook/route');

function createWebhookRequest(body = '{}', signature: string | null = 'valid-sig'): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (signature !== null) {
    headers['stripe-signature'] = signature;
  }
  return new Request('http://localhost/api/stripe/webhook', { method: 'POST', headers, body });
}

describe('POST /api/stripe/webhook — structured logging', () => {
  test('logs error with eventId and eventType when processStripeEvent throws', async () => {
    mockProcessStripeEvent.mockImplementation(async () => {
      throw new Error('DB write failed');
    });
    mockLogError.mockClear();

    const response = await POST(createWebhookRequest() as any);

    expect(response.status).toBe(500);
    expect(mockLogError).toHaveBeenCalledTimes(1);
    const [msg, data] = mockLogError.mock.calls[0] as [string, Record<string, unknown>];
    expect(msg).toBe('Stripe event processing failed');
    expect(data).toMatchObject({
      domain: 'webhook',
      eventId: 'evt_test_123',
      eventType: 'customer.subscription.updated',
    });
  });

  test('logs webhook info with eventId and eventType on success', async () => {
    mockProcessStripeEvent.mockImplementation(async () => {});
    mockLogWebhook.mockClear();

    const response = await POST(createWebhookRequest() as any);

    expect(response.status).toBe(200);
    expect(mockLogWebhook).toHaveBeenCalledTimes(1);
    const [msg, data] = mockLogWebhook.mock.calls[0] as [string, Record<string, unknown>];
    expect(msg).toBe('Stripe event processed');
    expect(data).toMatchObject({
      eventId: 'evt_test_123',
      eventType: 'customer.subscription.updated',
    });
  });
});
