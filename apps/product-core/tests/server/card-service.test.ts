import { describe, expect, test, vi } from 'vitest';

import { toMemberCardDto, toPublicCardVerificationDto } from '../../src/server/services';
import { AppError } from '../../src/server/errors';

describe('toMemberCardDto', () => {
  const baseCard = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    card_number: 'MEM-000001',
    membership_tier: 'MEMBER',
    status: 'ACTIVE' as const,
    qr_payload_url: '/verify-card/MEM-000001',
    issued_at: new Date('2026-06-15T10:00:00.000Z'),
    expires_at: null,
    revoked_at: null,
    revoked_reason: null,
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
      expires_at: new Date('2027-06-15T10:00:00.000Z'),
    });

    expect(dto.expiresAt).toBe('2027-06-15T10:00:00.000Z');
  });
});

describe('toPublicCardVerificationDto', () => {
  const baseCard = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    card_number: 'MEM-000001',
    membership_tier: 'MEMBER',
    status: 'ACTIVE' as const,
    qr_payload_url: '/verify-card/MEM-000001',
    issued_at: new Date('2026-06-15T10:00:00.000Z'),
    expires_at: null,
    revoked_at: null,
    revoked_reason: null,
    user: { display_name: 'John Doe' },
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
      user: { display_name: null },
    });

    expect(dto.displayName).toBeNull();
  });

  test('includes expiresAt when present', () => {
    const dto = toPublicCardVerificationDto({
      ...baseCard,
      expires_at: new Date('2027-06-15T10:00:00.000Z'),
    });

    expect(dto.expiresAt).toBe('2027-06-15T10:00:00.000Z');
  });
});
