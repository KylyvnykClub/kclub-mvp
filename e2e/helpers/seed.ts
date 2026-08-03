import type { Page } from '@playwright/test';

const PRODUCT_CORE_BASE = 'http://localhost:3000';
const E2E_TEST_SECRET = process.env.E2E_TEST_SECRET ?? 'e2e-test-secret-local';

export type SeedScenario =
  | 'member-with-card'
  | 'vip-member'
  | 'vip-with-business'
  | 'vip-with-published-business'
  | 'business-with-incoming-introduction'
  | 'staff-owner'
  | 'staff-moderator'
  | 'published-businesses';

export type SeedResult = {
  userId?: string;
  phone?: string;
  cardNumber?: string;
  businessId?: string;
  businessSlug?: string;
  staffPhone?: string;
};

export async function seedTestData(scenario: SeedScenario): Promise<SeedResult> {
  const response = await fetch(`${PRODUCT_CORE_BASE}/api/v1/test/seed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-e2e-secret': E2E_TEST_SECRET,
    },
    body: JSON.stringify({ scenario }),
  });

  if (!response.ok) {
    throw new Error(`Seed failed for scenario "${scenario}": ${response.status}`);
  }

  const json = (await response.json()) as { data: SeedResult };
  return json.data;
}

export async function teardownTestData(): Promise<void> {
  const response = await fetch(`${PRODUCT_CORE_BASE}/api/v1/test/teardown`, {
    method: 'POST',
    headers: {
      'x-e2e-secret': E2E_TEST_SECRET,
    },
  });

  if (!response.ok) {
    console.warn(`Teardown returned status ${response.status}`);
  }
}
