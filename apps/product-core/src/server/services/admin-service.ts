import {
  ERROR_CODES,
  type AdminBusinessDetailDto,
  type AdminBusinessListItemDto,
  type AdminBusinessOwnerSummaryDto,
  type AdminBusinessSubscriptionIndicatorDto,
  type AdminCardListItemDto,
  type AdminConfigEntryDto,
  type AdminIntroductionListItemDto,
  type AdminStaffListItemDto,
  type AdminSubscriptionListItemDto,
  type AdminUserDetailDto,
  type AdminUserListItemDto,
  type AuditLogDto,
  type BusinessStatus,
  type CategoryDto,
  type CityDto,
  type ClubCardStatus,
  type CountryDto,
  type DashboardMetricsDto,
  type IntroductionDto,
  type IntroductionStatus,
  type Locale,
  type MemberCardDto,
  type MembershipPlanDto,
  type MemberTier,
  type SubscriptionDto,
  type SubscriptionKind,
  type SubscriptionStatus,
  type UserStatus,
} from '@kclub/contracts';
import {
  canFeatureBusiness,
  canSetFeaturedFlag,
  canTransitionBusinessStatus,
  FEATURED_RECOMMENDED_MAX,
  FEATURED_TOP_MAX,
} from '@kclub/domain';
import type {
  AdminBusinessListInput,
  AdminBusinessUpdateInput,
  AdminCardListInput,
  AdminUserListInput,
  AuditLogListInput,
  BusinessApproveInput,
  BusinessFeaturedInput,
  BusinessHideInput,
  BusinessRejectInput,
  CategoryCreateInput,
  CategoryUpdateInput,
  CityCreateInput,
  CityUpdateInput,
  CountryCreateInput,
  CountryUpdateInput,
  IntroductionApproveInput,
  IntroductionRejectInput,
  RevokeCardInput,
  ReissueCardInput,
  BlockUserInput,
  UnblockUserInput,
  AdminConfigUpdateInput,
  StaffDeactivateInput,
  StaffRoleUpdateInput,
} from '@kclub/validation';
import { revalidateTag } from 'next/cache';

import { AppError } from '@/server/errors';
import { getDbClient, schema } from '@kclub/database';
import { eq, and, ne, desc, asc, inArray, ilike, or, not, exists, count, gte, lte } from 'drizzle-orm';
import { createDbAuditService } from '@/server/audit';
import type { RequestContext } from '@/server/context';
import { revokeCard, reissueCard, toMemberCardDto } from './card-service';
import { getStripeClient } from '@/server/stripe/client';
import { mapStripeStatusToLocal } from './webhook-service';

const auditService = createDbAuditService();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertValidUuid(id: string, entityName: string): void {
  if (!UUID_REGEX.test(id)) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_INVALID_INPUT,
      message: `Invalid ${entityName} ID format`,
      status: 400,
    });
  }
}

// ── Dashboard Metrics ──

export async function getDashboardMetrics(): Promise<DashboardMetricsDto> {
  const db = getDbClient();

  const getCount = async (table: any, condition?: any) => {
    const q = db.select({ value: count() }).from(table);
    if (condition) q.where(condition);
    const res = await q;
    return res[0].value;
  };

  const [
    totalUsers,
    blockedUsers,
    activeSubs,
    pastDueSubs,
    expiredSubs,
    businessesReview,
    introductionsSubmitted,
    introductionsInReview,
  ] = await Promise.all([
    getCount(schema.users),
    getCount(schema.users, eq(schema.users.status, 'BLOCKED')),
    getCount(schema.vipSubscriptions, eq(schema.vipSubscriptions.status, 'ACTIVE')),
    getCount(schema.vipSubscriptions, eq(schema.vipSubscriptions.status, 'PAST_DUE')),
    getCount(schema.vipSubscriptions, eq(schema.vipSubscriptions.status, 'EXPIRED')),
    getCount(schema.businessProfiles, eq(schema.businessProfiles.status, 'UNDER_REVIEW')),
    getCount(schema.businessIntroductions, eq(schema.businessIntroductions.status, 'SUBMITTED')),
    getCount(schema.businessIntroductions, eq(schema.businessIntroductions.status, 'IN_REVIEW')),
  ]);

  return {
    totalUsers,
    activeUsers: totalUsers - blockedUsers,
    blockedUsers,
    activeSubscriptions: activeSubs,
    pastDueSubscriptions: pastDueSubs,
    expiredSubscriptions: expiredSubs,
    businessesUnderReview: businessesReview,
    introductionsSubmitted,
    introductionsInReview,
  };
}

// ── Users ──

export async function listUsers(
  params: AdminUserListInput,
): Promise<{ data: AdminUserListItemDto[]; total: number }> {
  const db = getDbClient();

  const conditions = [];

  if (params.search) {
    conditions.push(or(
      ilike(schema.users.phone, `%${params.search}%`),
      ilike(schema.users.displayName, `%${params.search}%`)
    ));
  }

  if (params.status) {
    conditions.push(eq(schema.users.status, params.status));
  }

  if (params.membershipTier) {
    conditions.push(eq(schema.users.membershipTier, params.membershipTier));
  }

  // Exclude users who own an active business profile
  const activeBusinessExists = exists(
    db.select().from(schema.businessProfiles)
      .where(and(
        eq(schema.businessProfiles.userId, schema.users.id),
        ne(schema.businessProfiles.status, 'REJECTED')
      ))
  );
  conditions.push(not(activeBusinessExists));

  const finalCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const [users, totalRes] = await Promise.all([
    db.query.users.findMany({
      where: finalCondition,
      orderBy: (u, { desc }) => [desc(u.createdAt)],
      limit: params.limit,
      offset: (params.page - 1) * params.limit,
    }),
    db.select({ value: count() }).from(schema.users).where(finalCondition),
  ]);

  return { data: users.map(toAdminUserListItem), total: totalRes[0].value };
}

export async function getUserDetail(userId: string): Promise<AdminUserDetailDto> {
  const db = getDbClient();

  const [user, cards, subscriptions, auditEntries] = await Promise.all([
    db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) }),
    db.query.memberCards.findMany({
      where: (c, { eq }) => eq(c.userId, userId),
      orderBy: (c, { desc }) => [desc(c.issuedAt)],
    }),
    db.query.vipSubscriptions.findMany({
      where: (s, { eq }) => eq(s.userId, userId),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    }),
    db.query.auditLogs.findMany({
      where: (l, { eq }) => eq(l.entityId, userId),
      orderBy: (l, { desc }) => [desc(l.createdAt)],
      limit: 50,
    }),
  ]);

  if (!user) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'User not found',
      status: 404,
    });
  }

  return toAdminUserDetail(user, cards, subscriptions, auditEntries);
}

export async function syncVipSubscriptionForUser(
  userId: string,
  context: RequestContext,
): Promise<AdminUserDetailDto> {
  const db = getDbClient();
  const stripe = getStripeClient();

  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) });
  if (!user) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'User not found', status: 404 });
  }

  const existingLocal = await db.query.vipSubscriptions.findFirst({
    where: (s, { eq }) => eq(s.userId, userId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });

  if (!existingLocal?.stripeSubscriptionId && !existingLocal?.stripeCustomerId) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'No Stripe identifiers found locally. Ask the user to revisit the checkout success page, or enter the subscription ID manually in Stripe dashboard.',
      status: 404,
    });
  }

  let stripeSub;
  if (existingLocal.stripeSubscriptionId) {
    stripeSub = await stripe.subscriptions.retrieve(existingLocal.stripeSubscriptionId);
  } else {
    const list = await stripe.subscriptions.list({
      customer: existingLocal.stripeCustomerId!,
      limit: 5,
    });
    stripeSub = list.data[0];
  }

  if (!stripeSub) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'No Stripe subscription found for this user.',
      status: 404,
    });
  }

  const stripeSubPeriodEnd = (stripeSub as unknown as { current_period_end: number | null }).current_period_end;
  const newStatus = mapStripeStatusToLocal(stripeSub.status, stripeSubPeriodEnd) ?? 'ACTIVE';

  const resolvedCustomerId = existingLocal?.stripeCustomerId
    ?? (typeof stripeSub.customer === 'string' ? stripeSub.customer : null);

  let localSub;
  if (existingLocal) {
    [localSub] = await db.update(schema.vipSubscriptions).set({
      status: newStatus,
      stripeCustomerId: resolvedCustomerId,
      stripeSubscriptionId: stripeSub.id,
      currentPeriodEnd: stripeSubPeriodEnd ? new Date(stripeSubPeriodEnd * 1000) : null,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    }).where(eq(schema.vipSubscriptions.id, existingLocal.id)).returning();
  } else {
    [localSub] = await db.insert(schema.vipSubscriptions).values({
      userId,
      status: newStatus,
      stripeCustomerId: resolvedCustomerId,
      stripeSubscriptionId: stripeSub.id,
      currentPeriodEnd: stripeSubPeriodEnd ? new Date(stripeSubPeriodEnd * 1000) : null,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    }).returning();
  }

  await db.update(schema.users).set({
    membershipTier: newStatus === 'ACTIVE' || newStatus === 'PAST_DUE' ? 'VIP' : 'MEMBER',
  }).where(eq(schema.users.id, userId));

  await auditService.log(
    {
      action: 'STRIPE_WEBHOOK_REPLAYED',
      entityType: 'VipSubscription',
      entityId: userId,
      after: { subscriptionId: localSub.id, status: newStatus },
    },
    context,
  );

  revalidateTag('users');

  return getUserDetail(userId);
}

export async function blockUser(
  userId: string,
  input: BlockUserInput,
  context: RequestContext,
): Promise<AdminUserDetailDto> {
  const db = getDbClient();

  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) });
  if (!user) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'User not found',
      status: 404,
    });
  }

  if (user.status === 'BLOCKED') {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_CONFLICT,
      message: 'User is already blocked',
      status: 409,
    });
  }

  const [updated] = await db.transaction(async (tx) => {
    await tx.update(schema.memberCards).set({
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedReason: input.reason ?? 'User blocked',
    }).where(and(eq(schema.memberCards.userId, userId), eq(schema.memberCards.status, 'ACTIVE')));

    const [u] = await tx.update(schema.users).set({
      status: 'BLOCKED',
    }).where(eq(schema.users.id, userId)).returning();

    return [u];
  });

  await auditService.log(
    {
      action: 'USER_BLOCKED',
      entityType: 'User',
      entityId: userId,
      before: { status: user.status },
      after: { status: updated.status },
    },
    context,
  );

  return getUserDetail(userId);
}

export async function unblockUser(
  userId: string,
  input: UnblockUserInput,
  context: RequestContext,
): Promise<AdminUserDetailDto> {
  const db = getDbClient();

  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) });
  if (!user) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'User not found',
      status: 404,
    });
  }

  if (user.status !== 'BLOCKED') {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_CONFLICT,
      message: 'User is not blocked',
      status: 409,
    });
  }

  const [updated] = await db.update(schema.users).set({
    status: 'ACTIVE',
  }).where(eq(schema.users.id, userId)).returning();

  await auditService.log(
    {
      action: 'USER_UNBLOCKED',
      entityType: 'User',
      entityId: userId,
      before: { status: user.status },
      after: { status: updated.status },
    },
    context,
  );

  return getUserDetail(userId);
}

// ── Cards ──

export async function listCards(
  params: AdminCardListInput,
): Promise<{ data: AdminCardListItemDto[]; total: number }> {
  const db = getDbClient();

  const conditions = [];

  if (params.status) {
    conditions.push(eq(schema.memberCards.status, params.status));
  }

  if (params.membershipTier) {
    conditions.push(eq(schema.memberCards.membershipTier, params.membershipTier));
  }

  if (params.search) {
    conditions.push(or(
      ilike(schema.users.phone, `%${params.search}%`),
      ilike(schema.users.displayName, `%${params.search}%`)
    ));
  }

  const finalCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const [cards, totalRes] = await Promise.all([
    db.select({
      id: schema.memberCards.id,
      userId: schema.memberCards.userId,
      cardNumber: schema.memberCards.cardNumber,
      membershipTier: schema.memberCards.membershipTier,
      status: schema.memberCards.status,
      issuedAt: schema.memberCards.issuedAt,
      expiresAt: schema.memberCards.expiresAt,
      user: {
        phone: schema.users.phone,
        displayName: schema.users.displayName,
      }
    }).from(schema.memberCards)
      .leftJoin(schema.users, eq(schema.memberCards.userId, schema.users.id))
      .where(finalCondition)
      .orderBy(desc(schema.memberCards.issuedAt))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit),
    db.select({ value: count() }).from(schema.memberCards)
      .leftJoin(schema.users, eq(schema.memberCards.userId, schema.users.id))
      .where(finalCondition),
  ]);

  return {
    data: cards.map(c => ({
      id: c.id,
      userId: c.userId,
      userPhone: c.user?.phone ?? '',
      userDisplayName: c.user?.displayName ?? null,
      cardNumber: c.cardNumber,
      status: c.status as ClubCardStatus,
      membershipTier: c.membershipTier as MemberTier,
      issuedAt: c.issuedAt.toISOString(),
      expiresAt: c.expiresAt?.toISOString() ?? null,
    })),
    total: totalRes[0].value,
  };
}

export async function getCardDetail(cardId: string): Promise<MemberCardDto> {
  const db = getDbClient();
  const card = await db.query.memberCards.findFirst({ where: (c, { eq }) => eq(c.id, cardId) });
  if (!card) {
    throw new AppError({
      code: ERROR_CODES.CARD_NOT_FOUND,
      message: 'Card not found',
      status: 404,
    });
  }
  return toMemberCardDto(card);
}

export async function adminRevokeCard(
  cardId: string,
  input: RevokeCardInput,
  context: RequestContext,
): Promise<MemberCardDto> {
  const db = getDbClient();
  const card = await db.query.memberCards.findFirst({ where: (c, { eq }) => eq(c.id, cardId) });
  if (!card) {
    throw new AppError({
      code: ERROR_CODES.CARD_NOT_FOUND,
      message: 'Card not found',
      status: 404,
    });
  }

  const updated = await revokeCard(cardId, input.reason);

  await auditService.log(
    {
      action: 'CARD_REVOKED',
      entityType: 'MemberCard',
      entityId: cardId,
      before: { status: card.status, userId: card.userId },
      after: { status: updated.status },
    },
    context,
  );

  return toMemberCardDto(updated);
}

export async function adminReissueCard(
  cardId: string,
  input: ReissueCardInput,
  context: RequestContext,
): Promise<MemberCardDto> {
  const db = getDbClient();
  const card = await db.query.memberCards.findFirst({ where: (c, { eq }) => eq(c.id, cardId) });
  if (!card) {
    throw new AppError({
      code: ERROR_CODES.CARD_NOT_FOUND,
      message: 'Card not found',
      status: 404,
    });
  }

  const newCard = await reissueCard(card.userId, card.membershipTier, cardId, input.reason);

  await auditService.log(
    {
      action: 'CARD_ISSUED',
      entityType: 'MemberCard',
      entityId: newCard.id,
      before: { revokedCardId: cardId },
      after: { cardNumber: newCard.cardNumber, status: newCard.status },
    },
    context,
  );

  return toMemberCardDto(newCard);
}

// ── Businesses ──

export async function listBusinesses(
  params: AdminBusinessListInput,
): Promise<{ data: AdminBusinessListItemDto[]; total: number }> {
  const db = getDbClient();

  const conditions = [];
  if (params.status) conditions.push(eq(schema.businessProfiles.status, params.status));

  const finalCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const [businesses, totalRes] = await Promise.all([
    db.query.businessProfiles.findMany({
      where: finalCondition,
      with: {
        category: true,
        country: true,
        city: true,
        user: { columns: { id: true, phone: true, displayName: true, status: true, membershipTier: true } },
        subscriptions: {
          where: (s, { eq }) => eq(s.kind, 'BUSINESS_PLACEMENT'),
          orderBy: (s, { desc }) => [desc(s.createdAt)],
          limit: 1,
        }
      },
      orderBy: (bp, { desc }) => [desc(bp.createdAt)],
      limit: params.limit,
      offset: (params.page - 1) * params.limit,
    }),
    db.select({ value: count() }).from(schema.businessProfiles).where(finalCondition),
  ]);

  return { data: businesses.map(toAdminBusinessListItem), total: totalRes[0].value };
}

export async function getBusinessDetail(businessId: string): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: (bp, { eq }) => eq(bp.id, businessId),
    with: {
      category: true,
      country: true,
      city: true,
      user: { columns: { id: true, phone: true, displayName: true, status: true, membershipTier: true } },
      subscriptions: {
        where: (s, { eq }) => eq(s.kind, 'BUSINESS_PLACEMENT'),
        orderBy: (s, { desc }) => [desc(s.createdAt)],
        limit: 1,
      }
    },
  });
  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  const auditEntries = await db.query.auditLogs.findMany({
    where: (al, { eq, and }) => and(eq(al.entityType, 'BusinessProfile'), eq(al.entityId, businessId)),
    orderBy: (al, { desc }) => [desc(al.createdAt)],
    limit: 50,
  });

  return toAdminBusinessDetail(business, auditEntries);
}

export async function adminUpdateBusiness(
  businessId: string,
  input: AdminBusinessUpdateInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();

  const business = await db.query.businessProfiles.findFirst({
    where: (bp, { eq }) => eq(bp.id, businessId),
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  const [updated] = await db.update(schema.businessProfiles).set({
    ...(input.name !== undefined && { name: input.name }),
    ...(input.representativeName !== undefined && {
      representativeName: input.representativeName,
    }),
    ...(input.representativeEmail !== undefined && {
      representativeEmail: input.representativeEmail,
    }),
    ...(input.representativePhone !== undefined && {
      representativePhone: input.representativePhone,
    }),
    ...(input.websiteUrl !== undefined && { websiteUrl: input.websiteUrl }),
    ...(input.socialUrl !== undefined && { socialUrl: input.socialUrl }),
    ...(input.briefDescription !== undefined && {
      briefDescription: input.briefDescription,
    }),
    updatedAt: new Date(),
  }).where(eq(schema.businessProfiles.id, businessId)).returning();

  await auditService.log(
    {
      action: 'BUSINESS_UPDATED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: {
        name: business.name,
        representativeEmail: business.representativeEmail,
      },
      after: { name: updated.name, representativeEmail: updated.representativeEmail },
    },
    context,
  );

  return getBusinessDetail(businessId);
}

export async function approveBusiness(
  businessId: string,
  input: BusinessApproveInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: (bp, { eq }) => eq(bp.id, businessId),
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (!canTransitionBusinessStatus(business.status as BusinessStatus, 'APPROVED')) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_INVALID_STATUS_TRANSITION,
      message: `Cannot approve business with status ${business.status}`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessProfiles).set({
    status: 'APPROVED',
    approvedAt: new Date(),
    internalNotes: input.notes ?? business.internalNotes,
  }).where(eq(schema.businessProfiles.id, businessId)).returning();

  await auditService.log(
    {
      action: 'BUSINESS_APPROVED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: { status: business.status },
      after: { status: updated.status },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return getBusinessDetail(businessId);
}

export async function publishBusiness(
  businessId: string,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: (bp, { eq }) => eq(bp.id, businessId),
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (!canTransitionBusinessStatus(business.status as BusinessStatus, 'PUBLISHED')) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_INVALID_STATUS_TRANSITION,
      message: `Cannot publish business with status ${business.status}`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessProfiles).set({
    status: 'PUBLISHED',
    publishedAt: new Date(),
  }).where(eq(schema.businessProfiles.id, businessId)).returning();

  await auditService.log(
    {
      action: 'BUSINESS_PUBLISHED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: { status: business.status },
      after: { status: updated.status },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return getBusinessDetail(businessId);
}

export async function rejectBusiness(
  businessId: string,
  input: BusinessRejectInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: (bp, { eq }) => eq(bp.id, businessId),
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (!canTransitionBusinessStatus(business.status as BusinessStatus, 'REJECTED')) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_INVALID_STATUS_TRANSITION,
      message: `Cannot reject business with status ${business.status}`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessProfiles).set({
    status: 'REJECTED',
    rejectionReason: input.reason,
    rejectedAt: new Date(),
  }).where(eq(schema.businessProfiles.id, businessId)).returning();

  await auditService.log(
    {
      action: 'BUSINESS_REJECTED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: { status: business.status },
      after: { status: updated.status, reason: input.reason },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return getBusinessDetail(businessId);
}

export async function hideBusiness(
  businessId: string,
  input: BusinessHideInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: (bp, { eq }) => eq(bp.id, businessId),
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (!canTransitionBusinessStatus(business.status as BusinessStatus, 'HIDDEN')) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_INVALID_STATUS_TRANSITION,
      message: `Cannot hide business with status ${business.status}`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessProfiles).set({
    status: 'HIDDEN',
    hiddenAt: new Date(),
    featuredTop: false,
    featuredRecommended: false,
  }).where(eq(schema.businessProfiles.id, businessId)).returning();

  await auditService.log(
    {
      action: 'BUSINESS_HIDDEN',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: {
        status: business.status,
        featuredTop: business.featuredTop,
        featuredRecommended: business.featuredRecommended,
      },
      after: { status: updated.status, featuredTop: false, featuredRecommended: false },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return getBusinessDetail(businessId);
}

export async function updateBusinessFeatured(
  businessId: string,
  input: BusinessFeaturedInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();

  const business = await db.query.businessProfiles.findFirst({
    where: (bp, { eq }) => eq(bp.id, businessId),
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (!canFeatureBusiness(business.status as BusinessStatus)) {
    throw new AppError({
      code: ERROR_CODES.FEATURED_BUSINESS_NOT_PUBLISHED,
      message: 'Only PUBLISHED businesses can be featured',
      status: 409,
    });
  }

  const setTop = input.featuredTop;
  const setRecommended = input.featuredRecommended;

  const [updated] = await db.transaction(async (tx) => {
    if (setTop !== undefined && setTop !== business.featuredTop) {
      if (setTop) {
        const currentTopCountRes = await tx.select({ value: count() })
          .from(schema.businessProfiles)
          .where(and(eq(schema.businessProfiles.featuredTop, true), ne(schema.businessProfiles.id, businessId)));
        
        if (
          !canSetFeaturedFlag(
            business.status as BusinessStatus,
            true,
            currentTopCountRes[0].value,
            FEATURED_TOP_MAX,
          )
        ) {
          throw new AppError({
            code: ERROR_CODES.FEATURED_LIMIT_REACHED,
            message: `Maximum ${FEATURED_TOP_MAX} featured_top businesses reached`,
            status: 409,
          });
        }
      }
    }

    if (setRecommended !== undefined && setRecommended !== business.featuredRecommended) {
      if (setRecommended) {
        const currentRecommendedCountRes = await tx.select({ value: count() })
          .from(schema.businessProfiles)
          .where(and(eq(schema.businessProfiles.featuredRecommended, true), ne(schema.businessProfiles.id, businessId)));

        if (
          !canSetFeaturedFlag(
            business.status as BusinessStatus,
            true,
            currentRecommendedCountRes[0].value,
            FEATURED_RECOMMENDED_MAX,
          )
        ) {
          throw new AppError({
            code: ERROR_CODES.FEATURED_LIMIT_REACHED,
            message: `Maximum ${FEATURED_RECOMMENDED_MAX} featured_recommended businesses reached`,
            status: 409,
          });
        }
      }
    }

    const [b] = await tx.update(schema.businessProfiles).set({
      featuredTop: setTop !== undefined ? setTop : business.featuredTop,
      featuredRecommended:
        setRecommended !== undefined ? setRecommended : business.featuredRecommended,
    }).where(eq(schema.businessProfiles.id, businessId)).returning();

    return [b];
  });

  await auditService.log(
    {
      action: 'BUSINESS_FEATURED_UPDATED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: {
        featuredTop: business.featuredTop,
        featuredRecommended: business.featuredRecommended,
      },
      after: {
        featuredTop: updated.featuredTop,
        featuredRecommended: updated.featuredRecommended,
      },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return getBusinessDetail(businessId);
}

// ── Introductions ──

export async function listIntroductions(): Promise<AdminIntroductionListItemDto[]> {
  const db = getDbClient();
  const introductions = await db.query.businessIntroductions.findMany({
    with: {
      requesterUser: { columns: { id: true, phone: true, displayName: true } },
      requesterBusiness: { columns: { id: true, name: true, slug: true } },
      targetBusiness: { columns: { id: true, name: true, slug: true } },
    },
    orderBy: (bi, { desc }) => [desc(bi.createdAt)],
  });
  return introductions.map(toAdminIntroductionListItem);
}

export async function getIntroductionDetail(
  introductionId: string,
): Promise<AdminIntroductionListItemDto> {
  const db = getDbClient();
  const intro = await db.query.businessIntroductions.findFirst({
    where: (bi, { eq }) => eq(bi.id, introductionId),
    with: {
      requesterUser: { columns: { id: true, phone: true, displayName: true } },
      requesterBusiness: { columns: { id: true, name: true, slug: true } },
      targetBusiness: { columns: { id: true, name: true, slug: true } },
    },
  });
  if (!intro) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Introduction not found',
      status: 404,
    });
  }
  return toAdminIntroductionListItem(intro);
}

export async function approveIntroduction(
  introductionId: string,
  input: IntroductionApproveInput,
  context: RequestContext,
): Promise<IntroductionDto> {
  const db = getDbClient();
  const intro = await db.query.businessIntroductions.findFirst({ where: (bi, { eq }) => eq(bi.id, introductionId) });
  if (!intro) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Introduction not found',
      status: 404,
    });
  }

  const current = intro.status as IntroductionStatus;
  if (current !== 'SUBMITTED' && current !== 'IN_REVIEW') {
    throw new AppError({
      code: ERROR_CODES.INTRODUCTION_INVALID_STATUS_TRANSITION,
      message: `Cannot approve introduction with status ${current}`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessIntroductions).set({ status: 'APPROVED' })
    .where(eq(schema.businessIntroductions.id, introductionId)).returning();

  await auditService.log(
    {
      action: 'INTRODUCTION_APPROVED',
      entityType: 'BusinessIntroduction',
      entityId: introductionId,
      before: { status: current },
      after: { status: 'APPROVED' },
    },
    context,
  );

  return toIntroductionDto(updated);
}

export async function rejectIntroduction(
  introductionId: string,
  input: IntroductionRejectInput,
  context: RequestContext,
): Promise<IntroductionDto> {
  const db = getDbClient();
  const intro = await db.query.businessIntroductions.findFirst({ where: (bi, { eq }) => eq(bi.id, introductionId) });
  if (!intro) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Introduction not found',
      status: 404,
    });
  }

  const current = intro.status as IntroductionStatus;
  if (current !== 'SUBMITTED' && current !== 'IN_REVIEW') {
    throw new AppError({
      code: ERROR_CODES.INTRODUCTION_INVALID_STATUS_TRANSITION,
      message: `Cannot reject introduction with status ${current}`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessIntroductions).set({
    status: 'REJECTED',
    rejectionReason: input.reason,
  }).where(eq(schema.businessIntroductions.id, introductionId)).returning();

  await auditService.log(
    {
      action: 'INTRODUCTION_REJECTED',
      entityType: 'BusinessIntroduction',
      entityId: introductionId,
      before: { status: current },
      after: { status: 'REJECTED', reason: input.reason },
    },
    context,
  );

  return toIntroductionDto(updated);
}

export async function completeIntroduction(
  introductionId: string,
  context: RequestContext,
): Promise<IntroductionDto> {
  const db = getDbClient();
  const intro = await db.query.businessIntroductions.findFirst({ where: (bi, { eq }) => eq(bi.id, introductionId) });
  if (!intro) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Introduction not found',
      status: 404,
    });
  }

  if (intro.status !== 'APPROVED') {
    throw new AppError({
      code: ERROR_CODES.INTRODUCTION_INVALID_STATUS_TRANSITION,
      message: `Cannot complete introduction with status ${intro.status}`,
      status: 409,
    });
  }

  const [updated] = await db.update(schema.businessIntroductions).set({ status: 'COMPLETED' })
    .where(eq(schema.businessIntroductions.id, introductionId)).returning();

  await auditService.log(
    {
      action: 'INTRODUCTION_COMPLETED',
      entityType: 'BusinessIntroduction',
      entityId: introductionId,
      before: { status: 'APPROVED' },
      after: { status: 'COMPLETED' },
    },
    context,
  );

  return toIntroductionDto(updated);
}

// ── Taxonomy ──

export async function listCategories(): Promise<CategoryDto[]> {
  const db = getDbClient();
  const categories = await db.query.categories.findMany({ orderBy: (c, { asc }) => [asc(c.name)] });
  return categories.map(toCategoryDto);
}

export async function getCategory(categoryId: string): Promise<CategoryDto> {
  const db = getDbClient();
  const category = await db.query.categories.findFirst({ where: (c, { eq }) => eq(c.id, categoryId) });
  if (!category) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Category not found',
      status: 404,
    });
  }
  return toCategoryDto(category);
}

export async function createCategory(input: CategoryCreateInput): Promise<CategoryDto> {
  const db = getDbClient();
  const [category] = await db.insert(schema.categories).values({
    name: input.name,
    slug: input.slug,
    isHighRisk: input.isHighRisk ?? false,
    isActive: input.isActive ?? true,
  }).returning();
  revalidateTag('categories');
  return toCategoryDto(category);
}

export async function updateCategory(
  categoryId: string,
  input: CategoryUpdateInput,
): Promise<CategoryDto> {
  const db = getDbClient();
  const existing = await db.query.categories.findFirst({ where: (c, { eq }) => eq(c.id, categoryId) });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Category not found',
      status: 404,
    });
  }

  const [category] = await db.update(schema.categories).set({
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.isHighRisk !== undefined ? { isHighRisk: input.isHighRisk } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  }).where(eq(schema.categories.id, categoryId)).returning();
  
  revalidateTag('categories');
  return toCategoryDto(category);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const db = getDbClient();
  const existing = await db.query.categories.findFirst({ where: (c, { eq }) => eq(c.id, categoryId) });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Category not found',
      status: 404,
    });
  }
  await db.delete(schema.categories).where(eq(schema.categories.id, categoryId));
  revalidateTag('categories');
}

export async function listCountries(): Promise<CountryDto[]> {
  const db = getDbClient();
  const countries = await db.query.countries.findMany({ orderBy: (c, { asc }) => [asc(c.name)] });
  return countries.map(toCountryDto);
}

export async function getCountry(countryId: string): Promise<CountryDto> {
  const db = getDbClient();
  const country = await db.query.countries.findFirst({ where: (c, { eq }) => eq(c.id, countryId) });
  if (!country) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Country not found',
      status: 404,
    });
  }
  return toCountryDto(country);
}

export async function createCountry(input: CountryCreateInput): Promise<CountryDto> {
  const db = getDbClient();
  const [country] = await db.insert(schema.countries).values({
    code2: input.code2,
    code3: input.code3 ?? null,
    name: input.name,
    slug: input.slug,
    isActive: input.isActive ?? true,
  }).returning();
  return toCountryDto(country);
}

export async function updateCountry(
  countryId: string,
  input: CountryUpdateInput,
): Promise<CountryDto> {
  const db = getDbClient();
  const existing = await db.query.countries.findFirst({ where: (c, { eq }) => eq(c.id, countryId) });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Country not found',
      status: 404,
    });
  }

  const [country] = await db.update(schema.countries).set({
    ...(input.code2 !== undefined ? { code2: input.code2 } : {}),
    ...(input.code3 !== undefined ? { code3: input.code3 } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  }).where(eq(schema.countries.id, countryId)).returning();
  
  return toCountryDto(country);
}

export async function deleteCountry(countryId: string): Promise<void> {
  const db = getDbClient();
  const existing = await db.query.countries.findFirst({ where: (c, { eq }) => eq(c.id, countryId) });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Country not found',
      status: 404,
    });
  }
  await db.delete(schema.countries).where(eq(schema.countries.id, countryId));
}

export async function listCities(): Promise<CityDto[]> {
  const db = getDbClient();
  const cities = await db.query.cities.findMany({
    with: { country: { columns: { id: true, name: true } } },
    orderBy: (c, { asc }) => [asc(c.name)],
  });
  return cities.map(toCityDto);
}

export async function getCity(cityId: string): Promise<CityDto> {
  const db = getDbClient();
  const city = await db.query.cities.findFirst({
    where: (c, { eq }) => eq(c.id, cityId),
    with: { country: { columns: { id: true, name: true } } },
  });
  if (!city) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'City not found',
      status: 404,
    });
  }
  return toCityDto(city);
}

export async function createCity(input: CityCreateInput): Promise<CityDto> {
  const db = getDbClient();
  const country = await db.query.countries.findFirst({ where: (c, { eq }) => eq(c.id, input.countryId) });
  if (!country) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Country not found',
      status: 404,
    });
  }

  const [city] = await db.insert(schema.cities).values({
    countryId: input.countryId,
    name: input.name,
    slug: input.slug,
    isActive: input.isActive ?? true,
  }).returning();

  return getCity(city.id);
}

export async function updateCity(cityId: string, input: CityUpdateInput): Promise<CityDto> {
  const db = getDbClient();
  const existing = await db.query.cities.findFirst({ where: (c, { eq }) => eq(c.id, cityId) });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'City not found',
      status: 404,
    });
  }

  if (input.countryId !== undefined) {
    const country = await db.query.countries.findFirst({ where: (c, { eq }) => eq(c.id, input.countryId!) });
    if (!country) {
      throw new AppError({
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Country not found',
        status: 404,
      });
    }
  }

  await db.update(schema.cities).set({
    ...(input.countryId !== undefined ? { countryId: input.countryId } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  }).where(eq(schema.cities.id, cityId));
  
  return getCity(cityId);
}

export async function deleteCity(cityId: string): Promise<void> {
  const db = getDbClient();
  const existing = await db.query.cities.findFirst({ where: (c, { eq }) => eq(c.id, cityId) });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'City not found',
      status: 404,
    });
  }
  await db.delete(schema.cities).where(eq(schema.cities.id, cityId));
}

// ── Subscriptions (Admin Read) ──


export async function listSubscriptions(): Promise<SubscriptionDto[]> {
  const db = getDbClient();
  const subs = await db.query.vipSubscriptions.findMany({
    orderBy: (vs, { desc }) => [desc(vs.createdAt)],
  });
  return subs.map(toSubscriptionDto);
}

export async function listAdminSubscriptions(): Promise<AdminSubscriptionListItemDto[]> {
  const db = getDbClient();
  const subs = await db.query.subscriptions.findMany({
    with: {
      user: { columns: { id: true, phone: true, displayName: true, membershipTier: true } },
      businessProfile: { columns: { name: true } },
    },
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });
  return subs.map(toAdminSubscriptionListItem);
}

export async function getAdminSubscriptionDetail(
  subscriptionId: string,
): Promise<AdminSubscriptionListItemDto> {
  const db = getDbClient();
  const sub = await db.query.subscriptions.findFirst({
    where: (s, { eq }) => eq(s.id, subscriptionId),
    with: {
      user: { columns: { id: true, phone: true, displayName: true, membershipTier: true } },
      businessProfile: { columns: { name: true } },
    },
  });
  if (!sub) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Subscription not found',
      status: 404,
    });
  }
  return toAdminSubscriptionListItem(sub);
}

export async function getSubscriptionDetail(subscriptionId: string): Promise<SubscriptionDto> {
  const db = getDbClient();
  const sub = await db.query.vipSubscriptions.findFirst({ where: (vs, { eq }) => eq(vs.id, subscriptionId) });
  if (!sub) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Subscription not found',
      status: 404,
    });
  }
  return toSubscriptionDto(sub);
}

export async function adminCancelSubscription(
  subscriptionId: string,
  context: RequestContext,
): Promise<AdminSubscriptionListItemDto> {
  const db = getDbClient();
  const sub = await db.query.subscriptions.findFirst({
    where: (s, { eq }) => eq(s.id, subscriptionId),
  });
  if (!sub) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Subscription not found',
      status: 404,
    });
  }

  await db.update(schema.subscriptions).set({
    cancelAtPeriodEnd: true,
    canceledAt: new Date(),
  }).where(eq(schema.subscriptions.id, subscriptionId));

  await auditService.log(
    {
      action: 'SUBSCRIPTION_CANCELED',
      entityType: 'Subscription',
      entityId: subscriptionId,
      before: { cancelAtPeriodEnd: sub.cancelAtPeriodEnd },
      after: { cancelAtPeriodEnd: true },
    },
    context,
  );

  return getAdminSubscriptionDetail(subscriptionId);
}

// ── Audit Log ──

export async function listAuditLogs(
  filters: Partial<AuditLogListInput> = {},
): Promise<{ data: AuditLogDto[]; total: number }> {
  const db = getDbClient();
  const conditions = [];

  if (filters.action) conditions.push(eq(schema.auditLogs.action, filters.action));
  if (filters.actorRole) conditions.push(eq(schema.auditLogs.actorRole, filters.actorRole));
  if (filters.entityType) conditions.push(ilike(schema.auditLogs.entityType, `%${filters.entityType}%`));
  
  if (filters.dateFrom) conditions.push(gte(schema.auditLogs.createdAt, filters.dateFrom));
  if (filters.dateTo) conditions.push(lte(schema.auditLogs.createdAt, filters.dateTo));

  const finalCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const [logs, totalRes] = await Promise.all([
    db.query.auditLogs.findMany({
      where: finalCondition,
      orderBy: (al, { desc }) => [desc(al.createdAt)],
      limit,
      offset: (page - 1) * limit,
    }),
    db.select({ value: count() }).from(schema.auditLogs).where(finalCondition),
  ]);

  return {
    data: logs.map((log: any) => ({
      id: log.id,
      actorStaffId: log.actorStaffId ?? null,
      actorRole: log.actorRole as any,
      action: log.action as any,
      entityType: log.entityType,
      entityId: log.entityId,
      before: log.beforeData as Record<string, unknown> | null,
      after: log.afterData as Record<string, unknown> | null,
      ipAddress: log.ipAddress ?? null,
      createdAt: log.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
    total: totalRes[0].value,
  };
}

// ── Stripe Price Config (OWNER) ──

export const STRIPE_PRICE_KEYS = [
  'stripe_price_vip_membership_monthly',
  'stripe_price_business_placement_monthly',
] as const;

export type StripePriceKey = (typeof STRIPE_PRICE_KEYS)[number];

export type StripePricesMap = Record<StripePriceKey, string | null>;

export async function getStripePrices(): Promise<StripePricesMap> {
  const db = getDbClient();
  const configs = await db.query.adminConfig.findMany({
    where: (c, { inArray }) => inArray(c.key, STRIPE_PRICE_KEYS as unknown as string[]),
  });

  const result: StripePricesMap = {
    stripe_price_vip_membership_monthly: null,
    stripe_price_business_placement_monthly: null,
  };

  for (const config of configs) {
    result[config.key as StripePriceKey] = (config.value as { priceId?: string })?.priceId ?? null;
  }

  return result;
}

export async function updateStripePrices(
  input: Partial<StripePricesMap>,
  context: RequestContext,
): Promise<StripePricesMap> {
  const db = getDbClient();

  for (const [key, priceId] of Object.entries(input)) {
    if (!STRIPE_PRICE_KEYS.includes(key as StripePriceKey)) continue;

    await db.insert(schema.adminConfig).values({
      key,
      value: { priceId },
      description: `Stripe Price ID for ${key.replace('stripe_price_', '')}`,
    }).onConflictDoUpdate({
      target: schema.adminConfig.key,
      set: { value: { priceId } },
    });
  }

  return getStripePrices();
}

export async function getAdminConfig(key: string): Promise<AdminConfigEntryDto> {
  const db = getDbClient();
  const config = await db.query.adminConfig.findFirst({ where: (c, { eq }) => eq(c.key, key) });
  if (!config) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Config not found',
      status: 404,
    });
  }
  return toAdminConfigEntry(config);
}

export async function updateAdminConfig(
  key: string,
  input: AdminConfigUpdateInput,
): Promise<AdminConfigEntryDto> {
  const db = getDbClient();
  const existing = await db.query.adminConfig.findFirst({ where: (c, { eq }) => eq(c.key, key) });

  let result;
  if (existing) {
    [result] = await db.update(schema.adminConfig).set({
      value: input.value,
      description: input.description ?? existing.description,
      updatedAt: new Date(),
    }).where(eq(schema.adminConfig.key, key)).returning();
  } else {
    [result] = await db.insert(schema.adminConfig).values({
      key,
      value: input.value,
      description: input.description ?? null,
    }).returning();
  }
  return toAdminConfigEntry(result);
}

export async function getMembershipPlans(): Promise<MembershipPlanDto[]> {
  const db = getDbClient();
  const configs = await db.query.adminConfig.findMany({
    where: (c, { inArray }) => inArray(c.key, ['vip_membership_monthly', 'business_placement_monthly']),
  });
  return configs.map((c: any) => ({
    key: c.key,
    value: c.value,
    description: c.description,
  }));
}

export async function listStaff(context: RequestContext): Promise<AdminStaffListItemDto[]> {
  const db = getDbClient();
  const staff = await db.query.adminUsers.findMany({
    orderBy: (su, { asc }) => [asc(su.createdAt)],
  });
  return staff.map(toAdminStaffListItem);
}

export async function getStaffDetail(staffId: string): Promise<AdminStaffListItemDto> {
  assertValidUuid(staffId, 'staff');
  const db = getDbClient();
  const staff = await db.query.adminUsers.findFirst({ where: (su, { eq }) => eq(su.id, staffId) });
  if (!staff) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Staff not found',
      status: 404,
    });
  }
  return toAdminStaffListItem(staff);
}

export async function updateStaffRole(
  staffId: string,
  input: StaffRoleUpdateInput,
  context: RequestContext,
): Promise<AdminStaffListItemDto> {
  assertValidUuid(staffId, 'staff');
  const db = getDbClient();
  const staff = await db.query.adminUsers.findFirst({ where: (su, { eq }) => eq(su.id, staffId) });
  if (!staff) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Staff not found',
      status: 404,
    });
  }

  const [updated] = await db.update(schema.adminUsers).set({ role: input.role as any }).where(eq(schema.adminUsers.id, staffId)).returning();

  await auditService.log(
    {
      action: 'STAFF_ROLE_UPDATED',
      entityType: 'AdminUser',
      entityId: staffId,
      before: { role: staff.role },
      after: { role: updated.role },
    },
    context,
  );

  return toAdminStaffListItem(updated);
}

export async function deactivateStaff(
  staffId: string,
  input: StaffDeactivateInput,
  context: RequestContext,
): Promise<AdminStaffListItemDto> {
  assertValidUuid(staffId, 'staff');
  const db = getDbClient();
  const staff = await db.query.adminUsers.findFirst({ where: (su, { eq }) => eq(su.id, staffId) });
  if (!staff) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Staff not found',
      status: 404,
    });
  }

  if (!staff.isActive) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_CONFLICT,
      message: 'Staff is already inactive',
      status: 409,
    });
  }

  const [updated] = await db.update(schema.adminUsers).set({ isActive: false }).where(eq(schema.adminUsers.id, staffId)).returning();

  await auditService.log(
    {
      action: 'STAFF_ROLE_UPDATED',
      entityType: 'AdminUser',
      entityId: staffId,
      before: { isActive: true },
      after: { isActive: false, reason: input.reason ?? null },
    },
    context,
  );

  return toAdminStaffListItem(updated);
}

// ── DTO Helpers ──

function toAdminUserListItem(user: any): AdminUserListItemDto {
  return {
    id: user.id,
    phone: user.phone,
    displayName: user.displayName,
    status: user.status as UserStatus,
    membershipTier: user.membershipTier as MemberTier,
    createdAt: user.createdAt.toISOString(),
  };
}

function toAdminUserDetail(
  user: any,
  cards?: any[],
  subscriptions?: any[],
  auditEntries?: any[],
): AdminUserDetailDto {
  return {
    id: user.id,
    phone: user.phone,
    displayName: user.displayName,
    status: user.status as UserStatus,
    membershipTier: user.membershipTier as MemberTier,
    createdAt: user.createdAt.toISOString(),
    localePreference: user.localePreference as Locale | null,
    onboardingComplete: !!(user.displayName && user.localePreference && user.termsAcceptedAt),
    termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
    updatedAt: user.updatedAt.toISOString(),
    country: user.country ?? null,
    city: user.city ?? null,
    about: user.about ?? null,
    avatarUrl: user.avatarUrl ?? null,
    cards: (cards ?? []).map(toMemberCardDto),
    subscriptions: (subscriptions ?? []).map(toSubscriptionDto),
    auditEntries: (auditEntries ?? []).map((log: any) => ({
      id: log.id,
      actorStaffId: log.actorStaffId ?? null,
      actorRole: log.actorRole as any,
      action: log.action as any,
      entityType: log.entityType,
      entityId: log.entityId,
      before: log.beforeData as Record<string, unknown> | null,
      after: log.afterData as Record<string, unknown> | null,
      ipAddress: log.ipAddress ?? null,
      createdAt: log.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
  };
}

function toAdminCardListItem(card: any): AdminCardListItemDto {
  return {
    id: card.id,
    userId: card.userId,
    userPhone: card.user?.phone ?? '',
    userDisplayName: card.user?.displayName ?? null,
    cardNumber: card.cardNumber,
    status: card.status as ClubCardStatus,
    membershipTier: card.membershipTier as MemberTier,
    issuedAt: card.issuedAt.toISOString(),
    expiresAt: card.expiresAt?.toISOString() ?? null,
  };
}

function toAdminBusinessOwnerSummary(user: any): AdminBusinessOwnerSummaryDto {
  return {
    id: user.id,
    phone: user.phone,
    displayName: user.displayName,
    status: user.status as UserStatus,
    membershipTier: user.membershipTier as MemberTier,
  };
}

function toAdminBusinessSubscriptionIndicator(
  sub: any,
): AdminBusinessSubscriptionIndicatorDto | null {
  if (!sub) return null;
  return {
    status: sub.status as SubscriptionStatus,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
  };
}

function toAdminBusinessListItem(business: any): AdminBusinessListItemDto {
  const placementSub = business.subscriptions?.[0] ?? null;
  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    categoryName: business.category?.name ?? '',
    countryName: business.country?.name ?? '',
    cityName: business.city?.name ?? '',
    briefDescription: business.briefDescription,
    websiteUrl: business.websiteUrl,
    socialUrl: business.socialUrl,
    featuredTop: business.featuredTop,
    featuredRecommended: business.featuredRecommended,
    memberDiscountPercent: business.memberDiscountPercent ?? null,
    description: business.description,
    representativeName: business.representativeName,
    publishedAt: business.publishedAt?.toISOString() ?? null,
    ownerUserId: business.userId,
    status: business.status as BusinessStatus,
    representativeEmail: business.representativeEmail,
    representativePhone: business.representativePhone,
    rejectionReason: business.rejectionReason,
    internalNotes: business.internalNotes,
    approvedAt: business.approvedAt?.toISOString() ?? null,
    hiddenAt: business.hiddenAt?.toISOString() ?? null,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
    owner: toAdminBusinessOwnerSummary(business.user),
    placementSubscription: toAdminBusinessSubscriptionIndicator(placementSub),
  };
}

function toAdminBusinessDetail(business: any, auditEntries?: any[]): AdminBusinessDetailDto {
  return {
    ...toAdminBusinessListItem(business),
    auditEntries: (auditEntries ?? []).map((log: any) => ({
      id: log.id,
      actorStaffId: log.actorStaffId ?? null,
      actorRole: log.actorRole as any,
      action: log.action as any,
      entityType: log.entityType,
      entityId: log.entityId,
      before: log.beforeData as Record<string, unknown> | null,
      after: log.afterData as Record<string, unknown> | null,
      ipAddress: log.ipAddress ?? null,
      createdAt: log.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
  };
}

function toIntroductionDto(intro: any): IntroductionDto {
  return {
    id: intro.id,
    requesterUserId: intro.requesterUserId,
    requesterBusinessId: intro.requesterBusinessId ?? null,
    targetBusinessId: intro.targetBusinessId,
    status: intro.status as IntroductionStatus,
    clientName: intro.clientName ?? '',
    clientContact: intro.clientContact ?? '',
    message: intro.message,
    rejectionReason: intro.rejectionReason,
    createdAt: intro.createdAt.toISOString(),
    updatedAt: intro.updatedAt.toISOString(),
  };
}

function toAdminIntroductionListItem(intro: any): AdminIntroductionListItemDto {
  return {
    id: intro.id,
    requesterUserId: intro.requesterUserId,
    requesterBusinessId: intro.requesterBusinessId,
    targetBusinessId: intro.targetBusinessId,
    status: intro.status as IntroductionStatus,
    message: intro.message,
    rejectionReason: intro.rejectionReason,
    createdAt: intro.createdAt.toISOString(),
    updatedAt: intro.updatedAt.toISOString(),
    requesterUser: {
      id: intro.requesterUser?.id ?? '',
      phone: intro.requesterUser?.phone ?? '',
      displayName: intro.requesterUser?.displayName ?? null,
    },
    requesterBusiness: {
      id: intro.requesterBusiness?.id ?? '',
      name: intro.requesterBusiness?.name ?? '',
      slug: intro.requesterBusiness?.slug ?? '',
    },
    targetBusiness: {
      id: intro.targetBusiness?.id ?? '',
      name: intro.targetBusiness?.name ?? '',
      slug: intro.targetBusiness?.slug ?? '',
    },
  };
}

function toSubscriptionDto(sub: any): SubscriptionDto {
  return {
    id: sub.id,
    userId: sub.userId,
    status: sub.status as SubscriptionStatus,
    stripeCustomerId: sub.stripeCustomerId,
    stripeSubscriptionId: sub.stripeSubscriptionId,
    currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
  };
}

function toAdminSubscriptionListItem(sub: any): AdminSubscriptionListItemDto {
  return {
    id: sub.id,
    userId: sub.userId ?? null,
    kind: sub.kind as SubscriptionKind,
    status: sub.status as SubscriptionStatus,
    stripeCustomerId: sub.stripeCustomerId,
    stripeSubscriptionId: sub.stripeSubscriptionId,
    stripePriceId: sub.stripePriceId,
    currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
    user: sub.user
      ? {
          id: sub.user.id,
          phone: sub.user.phone,
          displayName: sub.user.displayName,
          membershipTier: sub.user.membershipTier as MemberTier,
        }
      : null,
    businessName: sub.businessProfile?.name ?? null,
  };
}

function toCategoryDto(cat: any): CategoryDto {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    isHighRisk: cat.isHighRisk,
    isActive: cat.isActive,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  };
}

function toCountryDto(country: any): CountryDto {
  return {
    id: country.id,
    code2: country.code2,
    code3: country.code3 ?? null,
    name: country.name,
    slug: country.slug,
    isActive: country.isActive,
    createdAt: country.createdAt.toISOString(),
    updatedAt: country.updatedAt.toISOString(),
  };
}

function toCityDto(city: any): CityDto {
  return {
    id: city.id,
    countryId: city.countryId,
    countryName: city.country?.name ?? '',
    name: city.name,
    slug: city.slug,
    isActive: city.isActive,
    createdAt: city.createdAt.toISOString(),
    updatedAt: city.updatedAt.toISOString(),
  };
}

function toAdminStaffListItem(staff: any): AdminStaffListItemDto {
  return {
    id: staff.id,
    phone: staff.phone,
    displayName: staff.displayName,
    role: staff.role,
    isActive: staff.isActive,
    totpVerified: !!staff.totpVerifiedAt,
    createdAt: staff.createdAt.toISOString(),
    updatedAt: staff.updatedAt.toISOString(),
  };
}

function toAdminConfigEntry(config: any): AdminConfigEntryDto {
  return {
    id: config.id,
    key: config.key,
    value: config.value,
    description: config.description,
    updatedAt: config.updatedAt.toISOString(),
  };
}
