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

function mockPrismaFindUnique(returnValue: unknown) {
  return mock(async () => returnValue);
}

function mockPrismaCreate(returnValue: unknown) {
  return mock(async () => returnValue);
}

function mockPrismaUpdate(returnValue: unknown) {
  return mock(async () => returnValue);
}

describe('webhook route guard logic', () => {
  test('returns 400 when STRIPE_WEBHOOK_SECRET is not set', async () => {
    const original = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_SECRET_KEY = 'sk_test';

    const { POST } = await import('../../src/app/api/stripe/webhook/route');
    const request = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=abc' },
      body: '{}',
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toContain('Invalid stripe signature');

    process.env.STRIPE_WEBHOOK_SECRET = original;
  });

  test('returns 400 when stripe-signature header is missing', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_SECRET_KEY = 'sk_test';

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
