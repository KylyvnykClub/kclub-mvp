import { describe, expect, test, vi } from 'vitest';

const mockLogError = vi.fn();
const mockLogWebhook = vi.fn();

vi.mock('@/server/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: mockLogError,
    debug: vi.fn(),
    auth: vi.fn(),
    webhook: mockLogWebhook,
    cron: vi.fn(),
    admin: vi.fn(),
  }),
}));

vi.mock('@/server/stripe/client', () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent: vi.fn(() => ({
        id: 'evt_test_123',
        type: 'customer.subscription.updated',
      })),
    },
  }),
}));

vi.mock('@/server/stripe/env', () => ({
  readStripeEnv: () => ({ STRIPE_WEBHOOK_SECRET: 'whsec_test' }),
}));

const mockProcessStripeEvent = vi.fn(async () => {});

vi.mock('@/server/services/webhook-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/server/services/webhook-service')>();
  return { ...actual, processStripeEvent: mockProcessStripeEvent };
});

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
