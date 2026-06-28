import { describe, expect, test, mock } from 'bun:test';

const mockStripeConstructEvent = mock(() => {
  throw new Error('Unmocked');
});

mock.module('stripe', () => {
  const StripeMock = class {
    webhooks = {
      constructEvent: mockStripeConstructEvent,
    };
  };
  return { default: StripeMock };
});

mock.module('@/server/db', () => ({
  getDbClient: () => {
    // @ts-ignore
    if (globalThis.dbMockForBun) return globalThis.dbMockForBun;
    return {};
  },
  getPrismaClient: () => ({}),
  schema: {},
}));

const mockReadStripeEnv = mock(() => ({}));
mock.module('@/server/stripe/env', () => ({
  readStripeEnv: mockReadStripeEnv,
}));

describe('webhook route guard logic', () => {
  test('returns 500 when STRIPE_WEBHOOK_SECRET is not set', async () => {
    mockReadStripeEnv.mockImplementation(() => {
      throw new Error('Missing env');
    });

    const { POST } = await import('../../src/app/api/stripe/webhook/route');
    const request = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'test-sig' },
      body: '{}',
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe('SERVER_ERROR');


  });

  test('returns 400 when stripe-signature header is missing', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    mockReadStripeEnv.mockImplementation(() => ({
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      STRIPE_SECRET_KEY: 'sk_test',
    }));

    const { POST } = await import('../../src/app/api/stripe/webhook/route');
    const request = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toContain('stripe-signature');
  });

  test('returns 400 when stripe-signature is present but invalid', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    mockStripeConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    mockReadStripeEnv.mockImplementation(() => ({
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      STRIPE_SECRET_KEY: 'sk_test',
    }));

    const { POST } = await import('../../src/app/api/stripe/webhook/route');
    const request = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'invalid' },
      body: '{}',
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toContain('Invalid stripe signature');
  });
});
