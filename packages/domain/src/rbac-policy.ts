import {
  MEMBER_CAPABILITIES,
  hasStaffPermission,
  getEffectivePermissions,
  isStaffRoleAtLeast,
  type MemberCapability,
  type MemberDashboardTab,
  type SubscriptionStatus,
  type BusinessStatus,
  type UserContext,
} from '@kclub/contracts';

export { hasStaffPermission, getEffectivePermissions, isStaffRoleAtLeast };

export type MemberCapabilityContext = {
  subscriptionStatus: SubscriptionStatus;
  businessStatus?: BusinessStatus | null;
};

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
  const tabs: MemberDashboardTab[] = ['details'];

  if (ctx.hasBusiness) {
    tabs.push('business');
    tabs.push('recommendations');
  }
  tabs.push('settings');
  if (ctx.isVip && !ctx.hasBusiness) tabs.push('introductions');

  return tabs;
}

export function canAccessDashboardTab(ctx: UserContext, tab: MemberDashboardTab): boolean {
  return getVisibleDashboardTabs(ctx).includes(tab);
}

export function canSubmitIntroduction(ctx: UserContext): boolean {
  return ctx.isVip;
}
