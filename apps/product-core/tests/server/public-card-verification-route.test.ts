import { beforeEach, describe, expect, test, vi } from 'vitest';

const publicVerifyCardMock = vi.fn();

vi.mock('@/server/services', () => ({
  publicVerifyCard: publicVerifyCardMock,
}));

describe('public card verification route', () => {
  beforeEach(() => {
    publicVerifyCardMock.mockReset();
  });

  test('returns only the approved public verification keys', async () => {
    publicVerifyCardMock.mockResolvedValue({
      cardNumber: 'MEM-000001',
      status: 'ACTIVE',
      membershipTier: 'MEMBER',
      issuedAt: '2026-06-15T10:00:00.000Z',
      expiresAt: null,
    });

    const { GET } = await import('../../src/app/api/v1/cards/verify/[cardNumber]/route');
    const response = await GET({} as never, {
      params: Promise.resolve({ cardNumber: 'MEM-000001' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(body.data).sort()).toEqual([
      'cardNumber',
      'expiresAt',
      'issuedAt',
      'membershipTier',
      'status',
    ]);
    expect(body.error).toBeNull();
    expect(body.meta.timestamp).toBeTypeOf('string');
  });
});
