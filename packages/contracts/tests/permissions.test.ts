import { describe, it, expect } from 'vitest';
import {
  hasStaffPermission,
  getEffectivePermissions,
  isStaffRoleAtLeast,
  STAFF_PERMISSIONS,
  STAFF_ROLE_PERMISSIONS,
  ALL_STAFF_PERMISSIONS,
  type StaffPermissionOverrides,
} from '../src/permissions';

describe('hasStaffPermission', () => {
  it('returns true for a permission in the role defaults', () => {
    expect(hasStaffPermission('ADMIN', 'TAXONOMY_MANAGE')).toBe(true);
  });

  it('returns false for a permission not in the role defaults', () => {
    expect(hasStaffPermission('MODERATOR', 'USERS_READ')).toBe(false);
  });

  it('grants via override even when role defaults deny', () => {
    const overrides: StaffPermissionOverrides = {
      granted: [STAFF_PERMISSIONS.USERS_READ],
      denied: [],
    };
    expect(hasStaffPermission('MODERATOR', 'USERS_READ', overrides)).toBe(true);
  });

  it('denies via override even when role defaults grant', () => {
    const overrides: StaffPermissionOverrides = {
      granted: [],
      denied: [STAFF_PERMISSIONS.TAXONOMY_MANAGE],
    };
    expect(hasStaffPermission('ADMIN', 'TAXONOMY_MANAGE', overrides)).toBe(false);
  });

  it('deny takes priority over grant when both are present', () => {
    const overrides: StaffPermissionOverrides = {
      granted: [STAFF_PERMISSIONS.STAFF_MANAGE],
      denied: [STAFF_PERMISSIONS.STAFF_MANAGE],
    };
    expect(hasStaffPermission('MODERATOR', 'STAFF_MANAGE', overrides)).toBe(false);
  });

  it('works with null overrides (falls back to role defaults)', () => {
    expect(hasStaffPermission('OWNER', 'STAFF_MANAGE', null)).toBe(true);
    expect(hasStaffPermission('ADMIN', 'STAFF_MANAGE', null)).toBe(false);
  });

  it('works with undefined overrides', () => {
    expect(hasStaffPermission('OWNER', 'STAFF_MANAGE', undefined)).toBe(true);
  });

  it('OWNER has all permissions by default', () => {
    for (const perm of ALL_STAFF_PERMISSIONS) {
      expect(hasStaffPermission('OWNER', perm)).toBe(true);
    }
  });

  it('ADMIN lacks STAFF_MANAGE and STRIPE_PRICES_MANAGE by default', () => {
    expect(hasStaffPermission('ADMIN', 'STAFF_MANAGE')).toBe(false);
    expect(hasStaffPermission('ADMIN', 'STRIPE_PRICES_MANAGE')).toBe(false);
  });

  it('SUPPORT stays strictly read-only by default', () => {
    expect(hasStaffPermission('SUPPORT', 'DASHBOARD_METRICS_READ')).toBe(true);
    expect(hasStaffPermission('SUPPORT', 'SUBSCRIPTIONS_READ')).toBe(true);
    expect(hasStaffPermission('SUPPORT', 'AUDIT_READ')).toBe(true);
    expect(hasStaffPermission('SUPPORT', 'USERS_READ')).toBe(false);
    expect(hasStaffPermission('SUPPORT', 'USERS_BLOCK')).toBe(false);
    expect(hasStaffPermission('SUPPORT', 'BUSINESSES_MODERATE')).toBe(false);
    expect(hasStaffPermission('SUPPORT', 'STAFF_MANAGE')).toBe(false);
  });
});

describe('getEffectivePermissions', () => {
  it('returns all role defaults when no overrides', () => {
    const perms = getEffectivePermissions('ADMIN');
    expect(perms).toEqual(expect.arrayContaining([...STAFF_ROLE_PERMISSIONS.ADMIN]));
    expect(perms).not.toContain('STAFF_MANAGE');
  });

  it('adds granted overrides to effective permissions', () => {
    const overrides: StaffPermissionOverrides = {
      granted: [STAFF_PERMISSIONS.STAFF_MANAGE],
      denied: [],
    };
    const perms = getEffectivePermissions('ADMIN', overrides);
    expect(perms).toContain('STAFF_MANAGE');
  });

  it('removes denied overrides from effective permissions', () => {
    const overrides: StaffPermissionOverrides = {
      granted: [],
      denied: [STAFF_PERMISSIONS.TAXONOMY_MANAGE],
    };
    const perms = getEffectivePermissions('ADMIN', overrides);
    expect(perms).not.toContain('TAXONOMY_MANAGE');
  });
});

describe('isStaffRoleAtLeast', () => {
  it('OWNER >= OWNER', () => {
    expect(isStaffRoleAtLeast('OWNER', 'OWNER')).toBe(true);
  });

  it('OWNER >= MODERATOR', () => {
    expect(isStaffRoleAtLeast('OWNER', 'MODERATOR')).toBe(true);
  });

  it('MODERATOR < ADMIN', () => {
    expect(isStaffRoleAtLeast('MODERATOR', 'ADMIN')).toBe(false);
  });

  it('ADMIN >= ADMIN', () => {
    expect(isStaffRoleAtLeast('ADMIN', 'ADMIN')).toBe(true);
  });

  it('keeps SUPPORT outside the hierarchical rank helper', () => {
    expect(isStaffRoleAtLeast('SUPPORT', 'SUPPORT')).toBe(true);
    expect(isStaffRoleAtLeast('OWNER', 'SUPPORT')).toBe(false);
    expect(isStaffRoleAtLeast('SUPPORT', 'MODERATOR')).toBe(false);
  });
});
