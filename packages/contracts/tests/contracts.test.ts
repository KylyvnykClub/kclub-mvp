import { describe, expect, test } from 'vitest';

import {
  ADMIN_API_BASE_PATH,
  ADMIN_BUSINESS_ONLY_KEYS,
  ADMIN_API_ROUTES,
  ERROR_CODES,
  MEMBER_CAPABILITIES,
  MEMBER_API_ROUTES,
  PUBLIC_BUSINESS_DTO_KEYS,
  STAFF_PERMISSIONS,
  STAFF_AUTH_STATES,
  STAFF_ROLE_PERMISSIONS,
  STAFF_ROLES,
  buildApiRoute,
  createApiError,
  createApiSuccess,
  isPublicBusinessDtoKey,
} from '../src';

describe('api envelope', () => {
  test('creates stable success and error envelopes', () => {
    expect(createApiSuccess({ ok: true })).toEqual({
      data: { ok: true },
      error: null,
    });

    expect(
      createApiError({
        code: ERROR_CODES.VALIDATION_INVALID_INPUT,
        message: 'Invalid input',
      }),
    ).toEqual({
      data: null,
      error: {
        code: ERROR_CODES.VALIDATION_INVALID_INPUT,
        message: 'Invalid input',
      },
    });
  });
});

describe('centralized constants', () => {
  test('exports expected error-code groups', () => {
    expect(ERROR_CODES.AUTH_SESSION_REQUIRED).toBe('AUTH_SESSION_REQUIRED');
    expect(ERROR_CODES.AUTH_SESSION_INVALID).toBe('AUTH_SESSION_INVALID');
    expect(ERROR_CODES.AUTH_SESSION_REVOKED).toBe('AUTH_SESSION_REVOKED');
    expect(ERROR_CODES.AUTH_PASSWORD_INVALID).toBe('AUTH_PASSWORD_INVALID');
    expect(ERROR_CODES.AUTH_STAFF_NOT_ALLOWED).toBe('AUTH_STAFF_NOT_ALLOWED');
    expect(ERROR_CODES.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
    expect(ERROR_CODES.BUSINESS_INVALID_STATUS_TRANSITION).toBe(
      'BUSINESS_INVALID_STATUS_TRANSITION',
    );
    expect(ERROR_CODES.VIP_REQUIRED).toBe('VIP_REQUIRED');
    expect(ERROR_CODES.CARD_ALREADY_ACTIVE).toBe('CARD_ALREADY_ACTIVE');
    expect(ERROR_CODES.INTRODUCTION_PENDING_EXISTS).toBe('INTRODUCTION_PENDING_EXISTS');
    expect(ERROR_CODES.FEATURED_LIMIT_REACHED).toBe('FEATURED_LIMIT_REACHED');
    expect(ERROR_CODES.RATE_LIMITED).toBe('RATE_LIMITED');
    expect(ERROR_CODES.SERVER_ERROR).toBe('SERVER_ERROR');
  });

  test('matches the staff permission matrix from the spec', () => {
    expect(STAFF_ROLES).toEqual(['OWNER', 'ADMIN', 'MODERATOR']);
    expect(STAFF_ROLE_PERMISSIONS.OWNER).toContain(STAFF_PERMISSIONS.STRIPE_PRICES_MANAGE);
    expect(STAFF_ROLE_PERMISSIONS.OWNER).toContain(STAFF_PERMISSIONS.STAFF_MANAGE);
    expect(STAFF_ROLE_PERMISSIONS.ADMIN).not.toContain(STAFF_PERMISSIONS.STAFF_MANAGE);
    expect(STAFF_ROLE_PERMISSIONS.MODERATOR).toContain(STAFF_PERMISSIONS.BUSINESSES_MODERATE);
    expect(STAFF_ROLE_PERMISSIONS.MODERATOR).not.toContain(STAFF_PERMISSIONS.USERS_BLOCK);
    expect(STAFF_ROLE_PERMISSIONS.OWNER).toContain(STAFF_PERMISSIONS.FINANCE_METRICS_READ);
    expect(STAFF_ROLE_PERMISSIONS.ADMIN).toContain(STAFF_PERMISSIONS.FINANCE_METRICS_READ);
    expect(STAFF_ROLE_PERMISSIONS.MODERATOR).not.toContain(STAFF_PERMISSIONS.FINANCE_METRICS_READ);
  });

  test('member capabilities enum contains expected keys', () => {
    expect(MEMBER_CAPABILITIES.VIP_UPGRADE).toBe('VIP_UPGRADE');
    expect(MEMBER_CAPABILITIES.BUSINESS_SUBMIT).toBe('BUSINESS_SUBMIT');
    expect(MEMBER_CAPABILITIES.INTRODUCTIONS_SUBMIT).toBe('INTRODUCTIONS_SUBMIT');
    expect(MEMBER_CAPABILITIES.BUSINESS_MANAGE_OWN).toBe('BUSINESS_MANAGE_OWN');
  });
});

describe('route contracts', () => {
  test('keeps member and admin route bases stable', () => {
    expect(MEMBER_API_ROUTES.ME).toBe('/api/v1/me');
    expect(MEMBER_API_ROUTES.AUTH_SIGN_UP).toBe('/api/v1/auth/sign-up');
    expect(MEMBER_API_ROUTES.AUTH_SIGN_IN).toBe('/api/v1/auth/sign-in');
    expect(MEMBER_API_ROUTES.AUTH_PASSWORD_RECOVERY_VERIFY).toBe(
      '/api/v1/auth/password-recovery/verify',
    );
    expect(MEMBER_API_ROUTES.TAXONOMY_CITIES).toBe('/api/v1/taxonomy/cities');
    expect(ADMIN_API_BASE_PATH).toBe('/api/admin/v1');
    expect(ADMIN_API_ROUTES.STAFF_AUTH_SESSION).toBe('/api/admin/v1/staff-auth/session');
    expect(ADMIN_API_ROUTES.STAFF_AUTH_PASSWORD_REGISTER).toBe(
      '/api/admin/v1/staff-auth/password/register',
    );
    expect(ADMIN_API_ROUTES.STAFF_AUTH_PASSWORD_SIGN_IN).toBe(
      '/api/admin/v1/staff-auth/password/sign-in',
    );
    expect(ADMIN_API_ROUTES.STAFF_AUTH_LOGOUT).toBe('/api/admin/v1/staff-auth/logout');
    expect(ADMIN_API_ROUTES.BUSINESS_APPROVE).toBe('/api/admin/v1/businesses/:id/approve');
    expect(ADMIN_API_ROUTES.USER_INVOICES).toBe('/api/admin/v1/users/:id/invoices');
  });

  test('defines staff auth states for the admin-app handshake', () => {
    expect(STAFF_AUTH_STATES).toEqual(['AUTHENTICATED']);
  });

  test('builds parameterized route patterns', () => {
    expect(buildApiRoute(MEMBER_API_ROUTES.CARD_VERIFY, { cardNumber: 'VIP-000001' })).toBe(
      '/api/v1/cards/verify/VIP-000001',
    );
    expect(buildApiRoute(ADMIN_API_ROUTES.WEBHOOK_REPLAY, { eventId: 'evt 1' })).toBe(
      '/api/admin/v1/webhooks/evt%201/replay',
    );
    expect(buildApiRoute(ADMIN_API_ROUTES.USER_INVOICES, { id: 'user 1' })).toBe(
      '/api/admin/v1/users/user%201/invoices',
    );
  });
});

describe('admin business DTO fields', () => {
  test('includes owner summary, placement indicator, and audit entries in detail', () => {
    const mockOwner = {
      id: 'o1',
      phone: '+1',
      displayName: 'Owner',
      status: 'ACTIVE' as const,
      membershipTier: 'VIP' as const,
    };
    const mockPlacement = { status: 'ACTIVE' as const, currentPeriodEnd: null };

    const detail = {
      id: 'b1',
      slug: 'test',
      name: 'Test',
      categoryName: 'Cat',
      countryName: 'US',
      cityName: 'NY',
      briefDescription: null,
      websiteUrl: null,
      socialUrl: null,
      featuredTop: false,
      featuredRecommended: false,
      description: null,
      representativeName: null,
      publishedAt: null,
      ownerUserId: 'o1',
      status: 'UNDER_REVIEW' as const,
      representativeEmail: 'e@e.com',
      representativePhone: '+1',
      rejectionReason: null,
      internalNotes: null,
      approvedAt: null,
      hiddenAt: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      owner: mockOwner,
      placementSubscription: mockPlacement,
      auditEntries: [],
    };

    expect(detail.owner.id).toBe('o1');
    expect(detail.owner.membershipTier).toBe('VIP');
    expect(detail.placementSubscription?.status).toBe('ACTIVE');
    expect(detail.auditEntries).toEqual([]);
  });
});

describe('public/admin DTO boundaries', () => {
  test('does not expose admin-only business fields as public DTO keys', () => {
    for (const key of ADMIN_BUSINESS_ONLY_KEYS) {
      expect(PUBLIC_BUSINESS_DTO_KEYS).not.toContain(key);
      expect(isPublicBusinessDtoKey(key)).toBe(false);
    }
  });

  test('keeps public business keys intentionally allow-listed', () => {
    expect(isPublicBusinessDtoKey('name')).toBe(true);
    expect(isPublicBusinessDtoKey('representativeEmail')).toBe(false);
    expect(isPublicBusinessDtoKey('internalNotes')).toBe(false);
  });
});
