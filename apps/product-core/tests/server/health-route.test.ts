import { describe, expect, test } from 'vitest';

import { GET } from '../../src/app/api/health/route';

describe('health route', () => {
  test('returns the shared API envelope with dependency status', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveProperty('status');
    expect(body.data).toHaveProperty('app', 'product-core');
    expect(body.data).toHaveProperty('dependencies');
    expect(body.data.dependencies).toHaveProperty('database');
    expect(body.error).toBeNull();
    expect(body.meta.timestamp).toBeTypeOf('string');
  });
});
