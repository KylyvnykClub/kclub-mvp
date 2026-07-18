import { describe, expect, test, vi } from 'vitest';

vi.mock('@/server/db', async (importOriginal) => {
  const realDb = await importOriginal<typeof import('../../src/server/db')>();
  const mockPrisma = {
    user: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async () => ({ id: 'mock-id' })),
      findFirst: vi.fn(async () => null),
    },
    memberCard: {
      create: vi.fn(async () => ({ id: 'mock-id' })),
      findFirst: vi.fn(async () => null),
    },
    vipSubscription: {
      create: vi.fn(async () => ({ id: 'mock-id' })),
    },
    businessProfile: {
      create: vi.fn(async () => ({ id: 'mock-id' })),
    },
    subscription: {
      create: vi.fn(async () => ({ id: 'mock-id' })),
    },
    category: {
      findFirst: vi.fn(async () => ({ id: 'cat-1', name: 'Category', slug: 'category' })),
      create: vi.fn(async () => ({ id: 'cat-1', name: 'Category', slug: 'category' })),
    },
    country: {
      findFirst: vi.fn(async () => ({
        id: 'coun-1',
        name: 'Country',
        code2: 'US',
        slug: 'country',
      })),
      create: vi.fn(async () => ({ id: 'coun-1', name: 'Country', code2: 'US', slug: 'country' })),
    },
    city: {
      findFirst: vi.fn(async () => ({
        id: 'city-1',
        name: 'City',
        country_id: 'coun-1',
        slug: 'city',
      })),
      create: vi.fn(async () => ({
        id: 'city-1',
        name: 'City',
        country_id: 'coun-1',
        slug: 'city',
      })),
    },
    $transaction: vi.fn(async (fn: Function) => fn({})),
  };
  return {
    ...realDb,
    getPrismaClient: () => mockPrisma,
  };
});

describe('E2E test route guard behavior', () => {
  test('seed returns 404 when E2E_TEST_SECRET is not set', async () => {
    const original = process.env.E2E_TEST_SECRET;
    delete process.env.E2E_TEST_SECRET;

    const { POST } = await import('../../src/app/api/v1/test/seed/route');
    const request = new Request('http://localhost/api/v1/test/seed', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'member-with-card' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe('NOT_FOUND');

    process.env.E2E_TEST_SECRET = original;
  });

  test('seed returns 401 when x-e2e-secret header is missing', async () => {
    process.env.E2E_TEST_SECRET = 'test-secret';

    const { POST } = await import('../../src/app/api/v1/test/seed/route');
    const request = new Request('http://localhost/api/v1/test/seed', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'member-with-card' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('seed returns 401 when x-e2e-secret header is wrong', async () => {
    process.env.E2E_TEST_SECRET = 'test-secret';

    const { POST } = await import('../../src/app/api/v1/test/seed/route');
    const request = new Request('http://localhost/api/v1/test/seed', {
      method: 'POST',
      headers: { 'x-e2e-secret': 'wrong-secret' },
      body: JSON.stringify({ scenario: 'member-with-card' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('seed returns 500 with SEED_FAILED when secret is correct but scenario is invalid', async () => {
    process.env.E2E_TEST_SECRET = 'test-secret';

    const { POST } = await import('../../src/app/api/v1/test/seed/route');
    const request = new Request('http://localhost/api/v1/test/seed', {
      method: 'POST',
      headers: { 'x-e2e-secret': 'test-secret' },
      body: JSON.stringify({ scenario: 'non-existent-scenario' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe('SEED_FAILED');
  });

  test('teardown returns 404 when E2E_TEST_SECRET is not set', async () => {
    const original = process.env.E2E_TEST_SECRET;
    delete process.env.E2E_TEST_SECRET;

    const { POST } = await import('../../src/app/api/v1/test/teardown/route');
    const request = new Request('http://localhost/api/v1/test/teardown', { method: 'POST' });
    const response = await POST(request);
    expect(response.status).toBe(404);

    process.env.E2E_TEST_SECRET = original;
  });

  test('teardown returns 401 when x-e2e-secret header is missing', async () => {
    process.env.E2E_TEST_SECRET = 'test-secret';

    const { POST } = await import('../../src/app/api/v1/test/teardown/route');
    const request = new Request('http://localhost/api/v1/test/teardown', { method: 'POST' });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
