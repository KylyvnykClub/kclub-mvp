import { describe, it, expect } from 'vitest';
import { createAccessControlProvider } from '@/providers/refine/access-control-provider';
import type { StaffPermissionOverrides, StaffRole } from '@kclub/contracts';

function makeIdentity(role: StaffRole, overrides?: StaffPermissionOverrides | null) {
  return async () => ({ role, permissionOverrides: overrides ?? null });
}

describe('accessControlProvider', () => {
  describe('unauthenticated', () => {
    it('denies when identity is null', async () => {
      const provider = createAccessControlProvider(async () => null);
      const result = await provider.can!({ resource: 'categories', action: 'list' });
      expect(result).toEqual({ can: false, reason: 'Not authenticated' });
    });
  });

  describe('role defaults', () => {
    it('allows ADMIN to list categories (TAXONOMY_MANAGE)', async () => {
      const provider = createAccessControlProvider(makeIdentity('ADMIN'));
      const result = await provider.can!({ resource: 'categories', action: 'list' });
      expect(result).toEqual({ can: true });
    });

    it('allows MODERATOR to list categories (TAXONOMY_MANAGE in MODERATOR defaults)', async () => {
      const provider = createAccessControlProvider(makeIdentity('MODERATOR'));
      const result = await provider.can!({ resource: 'categories', action: 'list' });
      expect(result).toEqual({ can: true });
    });

    it('denies MODERATOR to list users (USERS_READ not in MODERATOR defaults)', async () => {
      const provider = createAccessControlProvider(makeIdentity('MODERATOR'));
      const result = await provider.can!({ resource: 'users', action: 'list' });
      expect(result).toEqual({ can: false, reason: 'Missing permission: USERS_READ' });
    });

    it('denies ADMIN to manage staff (STAFF_MANAGE not in ADMIN defaults)', async () => {
      const provider = createAccessControlProvider(makeIdentity('ADMIN'));
      const result = await provider.can!({ resource: 'staff', action: 'create' });
      expect(result).toEqual({ can: false, reason: 'Missing permission: STAFF_MANAGE' });
    });

    it('allows OWNER to manage staff', async () => {
      const provider = createAccessControlProvider(makeIdentity('OWNER'));
      const result = await provider.can!({ resource: 'staff', action: 'create' });
      expect(result).toEqual({ can: true });
    });
  });

  describe('permission overrides', () => {
    it('grant override adds a permission the role lacks', async () => {
      const overrides: StaffPermissionOverrides = {
        granted: ['USERS_READ'],
        denied: [],
      };
      const provider = createAccessControlProvider(makeIdentity('MODERATOR', overrides));
      const result = await provider.can!({ resource: 'users', action: 'list' });
      expect(result).toEqual({ can: true });
    });

    it('deny override removes a permission the role has', async () => {
      const overrides: StaffPermissionOverrides = {
        granted: [],
        denied: ['TAXONOMY_MANAGE'],
      };
      const provider = createAccessControlProvider(makeIdentity('ADMIN', overrides));
      const result = await provider.can!({ resource: 'categories', action: 'edit' });
      expect(result).toEqual({ can: false, reason: 'Missing permission: TAXONOMY_MANAGE' });
    });

    it('deny wins over grant when both are set for the same permission', async () => {
      const overrides: StaffPermissionOverrides = {
        granted: ['STAFF_MANAGE'],
        denied: ['STAFF_MANAGE'],
      };
      const provider = createAccessControlProvider(makeIdentity('MODERATOR', overrides));
      const result = await provider.can!({ resource: 'staff', action: 'list' });
      expect(result).toEqual({ can: false, reason: 'Missing permission: STAFF_MANAGE' });
    });
  });

  describe('unknown resources and actions', () => {
    it('allows access to unmapped resources', async () => {
      const provider = createAccessControlProvider(makeIdentity('MODERATOR'));
      const result = await provider.can!({ resource: 'unknown-thing', action: 'list' });
      expect(result).toEqual({ can: true });
    });

    it('allows unmapped actions on known resources', async () => {
      const provider = createAccessControlProvider(makeIdentity('MODERATOR'));
      const result = await provider.can!({ resource: 'cards', action: 'create' });
      expect(result).toEqual({ can: true });
    });
  });
});
