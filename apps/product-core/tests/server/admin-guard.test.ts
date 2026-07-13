import { describe, expect, test, mock } from 'bun:test';

import {
  ERROR_CODES,
  STAFF_PERMISSIONS,
  type StaffProfileDto,
  type StaffRole,
} from '@kclub/contracts';

describe('requireStaffPermission', () => {
  test('throws AppError when permission is not granted', async () => {
    const { requireStaffPermission } = await import('../../src/server/admin-guard');

    const moderatorProfile: StaffProfileDto = {
      id: 'staff-1',
      phone: '+15551234567',
      displayName: 'Moderator',
      role: 'MODERATOR',
      totpVerified: true,
    };

    expect(() => requireStaffPermission(moderatorProfile, STAFF_PERMISSIONS.USERS_BLOCK)).toThrow();
    expect(() => requireStaffPermission(moderatorProfile, STAFF_PERMISSIONS.USERS_READ)).toThrow();

    expect(() =>
      requireStaffPermission(moderatorProfile, STAFF_PERMISSIONS.DASHBOARD_METRICS_READ),
    ).not.toThrow();
    expect(() =>
      requireStaffPermission(moderatorProfile, STAFF_PERMISSIONS.BUSINESSES_MODERATE),
    ).not.toThrow();
  });

  test('allows ADMIN with USERS_READ and STAFF_MANAGE permissions', async () => {
    const { requireStaffPermission } = await import('../../src/server/admin-guard');

    const adminProfile: StaffProfileDto = {
      id: 'staff-2',
      phone: '+15559876543',
      displayName: 'Admin User',
      role: 'ADMIN',
      totpVerified: true,
    };

    expect(() => requireStaffPermission(adminProfile, STAFF_PERMISSIONS.USERS_READ)).not.toThrow();
    expect(() => requireStaffPermission(adminProfile, STAFF_PERMISSIONS.USERS_BLOCK)).not.toThrow();
    expect(() =>
      requireStaffPermission(adminProfile, STAFF_PERMISSIONS.CARDS_REVOKE),
    ).not.toThrow();
    expect(() =>
      requireStaffPermission(adminProfile, STAFF_PERMISSIONS.STAFF_MANAGE),
    ).not.toThrow();
    expect(() =>
      requireStaffPermission(adminProfile, STAFF_PERMISSIONS.STRIPE_PRICES_MANAGE),
    ).toThrow();
  });

  test('allows OWNER with all permissions', async () => {
    const { requireStaffPermission } = await import('../../src/server/admin-guard');

    const ownerProfile: StaffProfileDto = {
      id: 'staff-3',
      phone: '+15551111111',
      displayName: 'Owner',
      role: 'OWNER',
      totpVerified: true,
    };

    expect(() =>
      requireStaffPermission(ownerProfile, STAFF_PERMISSIONS.STRIPE_PRICES_MANAGE),
    ).not.toThrow();
    expect(() =>
      requireStaffPermission(ownerProfile, STAFF_PERMISSIONS.STAFF_MANAGE),
    ).not.toThrow();
  });
});

describe('enrichStaffContext', () => {
  test('creates RequestContext with staff actor', async () => {
    const { enrichStaffContext } = await import('../../src/server/admin-guard');

    const adminProfile: StaffProfileDto = {
      id: 'staff-2',
      phone: '+15559876543',
      displayName: 'Admin',
      role: 'ADMIN',
      totpVerified: true,
    };

    const request = new Request('http://localhost/api/admin/v1/users');
    const context = enrichStaffContext(adminProfile, request);

    expect(context.actor).toEqual({
      kind: 'staff',
      staffId: 'staff-2',
      role: 'ADMIN',
    });
    expect(context.ipAddress).toBeNull();
    expect(context.locale).toBeNull();
    expect(typeof context.requestId).toBe('string');
  });
});

describe('ADMIN_API_ROUTES contract stability', () => {
  test('exports expected admin route constants', async () => {
    const { ADMIN_API_ROUTES } = await import('@kclub/contracts');

    expect(ADMIN_API_ROUTES.DASHBOARD_METRICS).toBe('/api/admin/v1/dashboard-metrics');
    expect(ADMIN_API_ROUTES.USERS).toBe('/api/admin/v1/users');
    expect(ADMIN_API_ROUTES.USER_INVOICES).toBe('/api/admin/v1/users/:id/invoices');
    expect(ADMIN_API_ROUTES.USER_BLOCK).toBe('/api/admin/v1/users/:id/block');
    expect(ADMIN_API_ROUTES.USER_UNBLOCK).toBe('/api/admin/v1/users/:id/unblock');
    expect(ADMIN_API_ROUTES.CARDS).toBe('/api/admin/v1/cards');
    expect(ADMIN_API_ROUTES.CARD_REVOKE).toBe('/api/admin/v1/cards/:id/revoke');
    expect(ADMIN_API_ROUTES.CARD_REISSUE).toBe('/api/admin/v1/cards/:id/reissue');
    expect(ADMIN_API_ROUTES.BUSINESSES).toBe('/api/admin/v1/businesses');
    expect(ADMIN_API_ROUTES.BUSINESS_APPROVE).toBe('/api/admin/v1/businesses/:id/approve');
    expect(ADMIN_API_ROUTES.BUSINESS_REJECT).toBe('/api/admin/v1/businesses/:id/reject');
    expect(ADMIN_API_ROUTES.BUSINESS_HIDE).toBe('/api/admin/v1/businesses/:id/hide');
    expect(ADMIN_API_ROUTES.BUSINESS_FEATURED).toBe('/api/admin/v1/businesses/:id/featured');
    expect(ADMIN_API_ROUTES.INTRODUCTIONS).toBe('/api/admin/v1/introductions');
    expect(ADMIN_API_ROUTES.INTRODUCTION_APPROVE).toBe('/api/admin/v1/introductions/:id/approve');
    expect(ADMIN_API_ROUTES.INTRODUCTION_REJECT).toBe('/api/admin/v1/introductions/:id/reject');
    expect(ADMIN_API_ROUTES.INTRODUCTION_COMPLETE).toBe('/api/admin/v1/introductions/:id/complete');
    expect(ADMIN_API_ROUTES.CATEGORIES).toBe('/api/admin/v1/categories');
    expect(ADMIN_API_ROUTES.COUNTRIES).toBe('/api/admin/v1/countries');
    expect(ADMIN_API_ROUTES.CITIES).toBe('/api/admin/v1/cities');
    expect(ADMIN_API_ROUTES.SUBSCRIPTIONS).toBe('/api/admin/v1/subscriptions');
    expect(ADMIN_API_ROUTES.STRIPE_PRICES).toBe('/api/admin/v1/stripe-prices');
    expect(ADMIN_API_ROUTES.ADMIN_CONFIG).toBe('/api/admin/v1/admin-config/:key');
    expect(ADMIN_API_ROUTES.STAFF).toBe('/api/admin/v1/staff');
    expect(ADMIN_API_ROUTES.AUDIT).toBe('/api/admin/v1/audit');
    expect(ADMIN_API_ROUTES.STAFF_AUTH_TOTP_SETUP).toBe('/api/admin/v1/staff-auth/totp/setup');
    expect(ADMIN_API_ROUTES.STAFF_AUTH_LOGOUT).toBe('/api/admin/v1/staff-auth/logout');
  });
});

describe('validation schemas for admin mutations', () => {
  test('validates block/reject reasons', async () => {
    const { blockUserSchema, unblockUserSchema, businessRejectSchema } =
      await import('@kclub/validation');

    expect(blockUserSchema.parse({ reason: 'Test reason' })).toEqual({ reason: 'Test reason' });
    expect(blockUserSchema.parse({})).toEqual({});
    expect(unblockUserSchema.parse({ reason: 'Appeal' })).toEqual({ reason: 'Appeal' });
    expect(businessRejectSchema.parse({ reason: 'Invalid docs' })).toEqual({
      reason: 'Invalid docs',
    });
    expect(() => businessRejectSchema.parse({})).toThrow();
  });

  test('validates featured toggle schema', async () => {
    const { businessFeaturedSchema } = await import('@kclub/validation');

    expect(businessFeaturedSchema.parse({ featuredTop: true })).toEqual({ featuredTop: true });
    expect(businessFeaturedSchema.parse({ featuredRecommended: true })).toEqual({
      featuredRecommended: true,
    });
    expect(
      businessFeaturedSchema.parse({ featuredTop: false, featuredRecommended: false }),
    ).toEqual({
      featuredTop: false,
      featuredRecommended: false,
    });
    expect(businessFeaturedSchema.parse({})).toEqual({});
  });

  test('validates taxonomy CRUD schemas', async () => {
    const { categoryCreateSchema, countryCreateSchema, cityCreateSchema } =
      await import('@kclub/validation');

    expect(categoryCreateSchema.parse({ name: 'Test', slug: 'test' })).toEqual({
      name: 'Test',
      slug: 'test',
      isHighRisk: false,
      isActive: true,
    });

    expect(countryCreateSchema.parse({ code2: 'US', name: 'USA', slug: 'usa' })).toEqual({
      code2: 'US',
      name: 'USA',
      slug: 'usa',
      isActive: true,
    });

    expect(
      cityCreateSchema.parse({
        countryId: '00000000-0000-0000-0000-000000000000',
        name: 'NYC',
        slug: 'nyc',
      }),
    ).toEqual({
      countryId: '00000000-0000-0000-0000-000000000000',
      name: 'NYC',
      slug: 'nyc',
      isActive: true,
    });
  });
});
