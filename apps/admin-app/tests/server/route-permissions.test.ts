import { describe, expect, test } from 'vitest';

import { hasRouteAccess, getRequiredRoles } from '../../src/server/auth/route-permissions';

describe('route-permissions', () => {
  test('getRequiredRoles returns correct roles for dashboard routes', () => {
    expect(getRequiredRoles('/dashboard')).toEqual(['OWNER', 'ADMIN', 'MODERATOR']);
    expect(getRequiredRoles('/dashboard/users')).toEqual(['OWNER', 'ADMIN']);
    expect(getRequiredRoles('/dashboard/businesses')).toEqual(['OWNER', 'ADMIN', 'MODERATOR']);
    expect(getRequiredRoles('/dashboard/billing')).toEqual(['OWNER', 'ADMIN']);
    expect(getRequiredRoles('/dashboard/settings')).toEqual(['OWNER', 'ADMIN']);
    expect(getRequiredRoles('/dashboard/staff')).toEqual(['OWNER']);
    expect(getRequiredRoles('/dashboard/account')).toEqual(['OWNER', 'ADMIN', 'MODERATOR']);
  });

  test('hasRouteAccess returns true for authorized roles', () => {
    expect(hasRouteAccess('OWNER', '/dashboard')).toBe(true);
    expect(hasRouteAccess('ADMIN', '/dashboard/users')).toBe(true);
    expect(hasRouteAccess('MODERATOR', '/dashboard/businesses')).toBe(true);
    expect(hasRouteAccess('ADMIN', '/dashboard/billing')).toBe(true);
    expect(hasRouteAccess('ADMIN', '/dashboard/settings')).toBe(true);
    expect(hasRouteAccess('OWNER', '/dashboard/staff')).toBe(true);
    expect(hasRouteAccess('MODERATOR', '/dashboard/account')).toBe(true);
  });

  test('hasRouteAccess returns false for unauthorized roles', () => {
    expect(hasRouteAccess('MODERATOR', '/dashboard/users')).toBe(false);
    expect(hasRouteAccess('MODERATOR', '/dashboard/billing')).toBe(false);
    expect(hasRouteAccess('MODERATOR', '/dashboard/settings')).toBe(false);
    expect(hasRouteAccess('ADMIN', '/dashboard/staff')).toBe(false);
    expect(hasRouteAccess('MODERATOR', '/dashboard/staff')).toBe(false);
  });

  test('hasRouteAccess handles nested routes', () => {
    expect(hasRouteAccess('ADMIN', '/dashboard/users/123')).toBe(true);
    expect(hasRouteAccess('MODERATOR', '/dashboard/users/123')).toBe(false);
    expect(hasRouteAccess('MODERATOR', '/dashboard/businesses/abc')).toBe(true);
    expect(hasRouteAccess('ADMIN', '/dashboard/staff/123')).toBe(false);
  });
});
