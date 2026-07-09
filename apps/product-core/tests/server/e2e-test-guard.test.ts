import { describe, expect, test, mock } from 'bun:test';

// mock.module leaks across test files in the same bun process; spread the real
// module so other suites importing named exports (getDbClient, schema) keep them
const realDb = await import('../../src/server/db');

mock.module('@/server/db', () => {
  const mockPrisma = {
    user: {
      findUnique: mock(async () => null),
      create: mock(async () => ({ id: 'mock-id' })),
      findFirst: mock(async () => null),
    },
    memberCard: {
      create: mock(async () => ({ id: 'mock-id' })),
      findFirst: mock(async () => null),
    },
    vipSubscription: {
      create: mock(async () => ({ id: 'mock-id' })),
    },
    businessProfile: {
      create: mock(async () => ({ id: 'mock-id' })),
    },
    subscription: {
      create: mock(async () => ({ id: 'mock-id' })),
    },
    category: {
      findFirst: mock(async () => ({ id: 'cat-1', name: 'Category', slug: 'category' })),
      create: mock(async () => ({ id: 'cat-1', name: 'Category', slug: 'category' })),
    },
    country: {
      findFirst: mock(async () => ({
        id: 'coun-1',
        name: 'Country',
        code2: 'US',
        slug: 'country',
      })),
      create: mock(async () => ({ id: 'coun-1', name: 'Country', code2: 'US', slug: 'country' })),
    },
    city: {
      findFirst: mock(async () => ({
        id: 'city-1',
        name: 'City',
        country_id: 'coun-1',
        slug: 'city',
      })),
      create: mock(async () => ({
        id: 'city-1',
        name: 'City',
        country_id: 'coun-1',
        slug: 'city',
      })),
    },
    $transaction: mock(async (fn: Function) => fn({})),
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
