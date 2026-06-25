import {
  MEMBER_CAPABILITIES,
  STAFF_ROLE_PERMISSIONS,
  STAFF_ROLE_RANK,
  type MemberCapability,
  type MemberDashboardTab,
  type StaffPermission,
  type StaffRole,
  type SubscriptionStatus,
  type BusinessStatus,
  type UserContext,
} from '@kclub/contracts';

export type MemberCapabilityContext = {
  subscriptionStatus: SubscriptionStatus;
  businessStatus?: BusinessStatus | null;
};

export function hasStaffPermission(role: StaffRole, permission: StaffPermission): boolean {
  return (STAFF_ROLE_PERMISSIONS[role] as readonly StaffPermission[]).includes(permission);
}

export function isStaffRoleAtLeast(
  role: StaffRole,
  minimumRole: Exclude<StaffRole, 'SUPPORT'>,
): boolean {
  return STAFF_ROLE_RANK[role] >= STAFF_ROLE_RANK[minimumRole];
}

export function hasActiveVipAccess(status: SubscriptionStatus): boolean {
  return status === 'ACTIVE' || status === 'CANCELED' || status === 'PAST_DUE';
}

export function getUserContext(context: MemberCapabilityContext): UserContext {
  const hasBusiness = context.businessStatus != null && context.businessStatus !== 'REJECTED';
  return {
    isVip: hasActiveVipAccess(context.subscriptionStatus),
    hasBusiness,
    businessPublished: context.businessStatus === 'PUBLISHED',
  };
}

export function getMemberCapabilities(ctx: UserContext): readonly MemberCapability[] {
  const caps: MemberCapability[] = [
    MEMBER_CAPABILITIES.DIGITAL_CARD_READ,
    MEMBER_CAPABILITIES.DIRECTORY_READ,
  ];
  if (!ctx.isVip) caps.push(MEMBER_CAPABILITIES.VIP_UPGRADE);
  if (ctx.isVip) {
    caps.push(MEMBER_CAPABILITIES.VIP_SUBSCRIPTION_MANAGE);
  }
  if (ctx.isVip || ctx.hasBusiness) {
    caps.push(MEMBER_CAPABILITIES.INTRODUCTIONS_SUBMIT);
  }
  if (!ctx.hasBusiness) caps.push(MEMBER_CAPABILITIES.BUSINESS_SUBMIT);
  if (ctx.hasBusiness) caps.push(MEMBER_CAPABILITIES.BUSINESS_MANAGE_OWN);
  return caps;
}

export function hasMemberCapability(ctx: UserContext, capability: MemberCapability): boolean {
  return getMemberCapabilities(ctx).includes(capability);
}

export function getVisibleDashboardTabs(ctx: UserContext): readonly MemberDashboardTab[] {
  const tabs: MemberDashboardTab[] = [
    'details', 'card', 'subscription', 'settings',
  ];
  if (ctx.isVip || ctx.hasBusiness) tabs.push('introductions');
  if (ctx.hasBusiness) tabs.push('business');
  return tabs;
}

export function canAccessDashboardTab(ctx: UserContext, tab: MemberDashboardTab): boolean {
  return getVisibleDashboardTabs(ctx).includes(tab);
}

export function canSubmitIntroduction(ctx: UserContext): boolean {
  return ctx.isVip;
}
