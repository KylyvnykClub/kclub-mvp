import type { AccessControlProvider } from '@refinedev/core';
import {
  hasStaffPermission,
  type StaffPermission,
  type StaffPermissionOverrides,
  type StaffRole,
} from '@kclub/contracts';

type ResourceAction = 'list' | 'show' | 'create' | 'edit' | 'delete' | 'featured';

const RESOURCE_PERMISSION_MAP: Record<string, Partial<Record<ResourceAction, StaffPermission>>> = {
  categories: {
    list: 'TAXONOMY_MANAGE',
    create: 'TAXONOMY_MANAGE',
    edit: 'TAXONOMY_MANAGE',
    delete: 'TAXONOMY_MANAGE',
  },
  countries: {
    list: 'TAXONOMY_MANAGE',
    create: 'TAXONOMY_MANAGE',
    edit: 'TAXONOMY_MANAGE',
    delete: 'TAXONOMY_MANAGE',
  },
  cities: {
    list: 'TAXONOMY_MANAGE',
    create: 'TAXONOMY_MANAGE',
    edit: 'TAXONOMY_MANAGE',
    delete: 'TAXONOMY_MANAGE',
  },
  businesses: {
    list: 'BUSINESSES_MODERATE',
    show: 'BUSINESSES_MODERATE',
    edit: 'BUSINESSES_MODERATE',
    featured: 'FEATURED_BUSINESSES_MANAGE',
  },
  cards: {
    list: 'CARDS_READ',
  },
  introductions: {
    list: 'INTRODUCTIONS_MODERATE',
    edit: 'INTRODUCTIONS_MODERATE',
  },
  users: {
    list: 'USERS_READ',
    show: 'USERS_READ',
    edit: 'USERS_BLOCK',
  },
  staff: {
    list: 'STAFF_MANAGE',
    create: 'STAFF_MANAGE',
    edit: 'STAFF_MANAGE',
    delete: 'STAFF_MANAGE',
  },
  audit: {
    list: 'AUDIT_READ',
  },
  subscriptions: {
    list: 'SUBSCRIPTIONS_READ',
    edit: 'SUBSCRIPTIONS_CANCEL_ADMIN',
  },
  memberships: {
    list: 'SUBSCRIPTIONS_READ',
  },
  'stripe-prices': {
    list: 'STRIPE_PRICES_MANAGE',
    create: 'STRIPE_PRICES_MANAGE',
    edit: 'STRIPE_PRICES_MANAGE',
  },
};

type StaffIdentity = {
  role: StaffRole;
  permissionOverrides: StaffPermissionOverrides | null;
};

export function createAccessControlProvider(
  getIdentity: () => Promise<StaffIdentity | null>,
): AccessControlProvider {
  return {
    can: async ({ resource, action }) => {
      const identity = await getIdentity();
      if (!identity) {
        return { can: false, reason: 'Not authenticated' };
      }

      const resourceMap = resource ? RESOURCE_PERMISSION_MAP[resource] : undefined;
      if (!resourceMap) {
        return { can: true };
      }

      const requiredPermission = resourceMap[action as ResourceAction];
      if (!requiredPermission) {
        return { can: true };
      }

      const allowed = hasStaffPermission(
        identity.role,
        requiredPermission,
        identity.permissionOverrides,
      );

      return allowed
        ? { can: true }
        : { can: false, reason: `Missing permission: ${requiredPermission}` };
    },
  };
}
