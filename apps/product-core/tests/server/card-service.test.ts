import { describe, expect, test, mock } from 'bun:test';

import { toMemberCardDto, toPublicCardVerificationDto } from '../../src/server/services';
import { AppError } from '../../src/server/errors';

describe('toMemberCardDto', () => {
  const baseCard = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    cardNumber: 'MEM-000001',
    membershipTier: 'MEMBER',
    status: 'ACTIVE' as const,
    qrPayloadUrl: '/verify-card/MEM-000001',
    issuedAt: new Date('2026-06-15T10:00:00.000Z'),
    expiresAt: null,
    revokedAt: null,
    revokedReason: null,
    createdAt: new Date('2026-06-15T10:00:00.000Z'),
    updatedAt: new Date('2026-06-15T10:00:00.000Z'),
  };

  test('maps card record to MemberCardDto correctly', () => {
    const dto = toMemberCardDto(baseCard);

    expect(dto).toEqual({
      id: '550e8400-e29b-41d4-a716-446655440001',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      cardNumber: 'MEM-000001',
      status: 'ACTIVE',
      membershipTier: 'MEMBER',
      qrPayloadUrl: '/verify-card/MEM-000001',
      issuedAt: '2026-06-15T10:00:00.000Z',
      expiresAt: null,
    });
  });

  test('maps revoked status correctly', () => {
    const dto = toMemberCardDto({ ...baseCard, status: 'REVOKED' });
    expect(dto.status).toBe('REVOKED');
  });

  test('includes expiresAt when present', () => {
    const dto = toMemberCardDto({
      ...baseCard,
      expiresAt: new Date('2027-06-15T10:00:00.000Z'),
    });

    expect(dto.expiresAt).toBe('2027-06-15T10:00:00.000Z');
  });
});

describe('toPublicCardVerificationDto', () => {
  const baseCard = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    cardNumber: 'MEM-000001',
    membershipTier: 'MEMBER',
    status: 'ACTIVE' as const,
    qrPayloadUrl: '/verify-card/MEM-000001',
    issuedAt: new Date('2026-06-15T10:00:00.000Z'),
    expiresAt: null,
    revokedAt: null,
    revokedReason: null,
    createdAt: new Date('2026-06-15T10:00:00.000Z'),
    updatedAt: new Date('2026-06-15T10:00:00.000Z'),
    user: { displayName: 'John Doe' },
  };

  test('maps to public DTO correctly', () => {
    const dto = toPublicCardVerificationDto(baseCard);

    expect(dto).toEqual({
      cardNumber: 'MEM-000001',
      status: 'ACTIVE',
      membershipTier: 'MEMBER',
      displayName: 'John Doe',
      issuedAt: '2026-06-15T10:00:00.000Z',
      expiresAt: null,
    });
  });

  test('does not include userId or card id', () => {
    const dto = toPublicCardVerificationDto(baseCard);

    expect((dto as Record<string, unknown>).userId).toBeUndefined();
    expect((dto as Record<string, unknown>).id).toBeUndefined();
    expect((dto as Record<string, unknown>).qrPayloadUrl).toBeUndefined();
  });

  test('handles null display name', () => {
    const dto = toPublicCardVerificationDto({
      ...baseCard,
      user: { displayName: null },
    });

    expect(dto.displayName).toBeNull();
  });

  test('includes expiresAt when present', () => {
    const dto = toPublicCardVerificationDto({
      ...baseCard,
      expiresAt: new Date('2027-06-15T10:00:00.000Z'),
    });

    expect(dto.expiresAt).toBe('2027-06-15T10:00:00.000Z');
  });
});
