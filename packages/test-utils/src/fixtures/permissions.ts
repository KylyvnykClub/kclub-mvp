import {
  MEMBER_DASHBOARD_TABS,
  STAFF_PERMISSIONS,
  STAFF_ROLES,
  type MemberDashboardTab,
  type StaffPermission,
  type StaffRole,
} from '@kclub/contracts';
import {
  getMemberCapabilities,
  getVisibleDashboardTabs,
  getUserContext,
  hasStaffPermission,
} from '@kclub/domain';

export const STAFF_PERMISSION_MATRIX_FIXTURE = Object.fromEntries(
  STAFF_ROLES.map((role) => [
    role,
    Object.fromEntries(
      Object.values(STAFF_PERMISSIONS).map((permission) => [
        permission,
        hasStaffPermission(role, permission),
      ]),
    ) as Record<StaffPermission, boolean>,
  ]),
) as Record<StaffRole, Record<StaffPermission, boolean>>;

const memberCtx = getUserContext({ subscriptionStatus: 'NONE' });
const vipCtx = getUserContext({ subscriptionStatus: 'ACTIVE' });
const hasBusinessCtx = getUserContext({
  subscriptionStatus: 'ACTIVE',
  businessStatus: 'UNDER_REVIEW',
});

export const MEMBER_PERMISSION_FIXTURES = {
  MEMBER: {
    capabilities: getMemberCapabilities(memberCtx),
    visibleTabs: getVisibleDashboardTabs(memberCtx),
  },
  VIP: {
    capabilities: getMemberCapabilities(vipCtx),
    visibleTabs: getVisibleDashboardTabs(vipCtx),
  },
  HAS_BUSINESS: {
    capabilities: getMemberCapabilities(hasBusinessCtx),
    visibleTabs: getVisibleDashboardTabs(hasBusinessCtx),
  },
} as const satisfies Record<
  'MEMBER' | 'VIP' | 'HAS_BUSINESS',
  {
    capabilities: readonly string[];
    visibleTabs: readonly MemberDashboardTab[];
  }
>;

export const ALL_MEMBER_DASHBOARD_TABS_FIXTURE = [...MEMBER_DASHBOARD_TABS];
