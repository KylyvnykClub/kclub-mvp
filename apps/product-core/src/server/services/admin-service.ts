import { revalidateTag } from 'next/cache';
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNull,
  not,
  or,
  sql,
} from 'drizzle-orm';

import {
  ERROR_CODES,
  type AdminBusinessDetailDto,
  type AdminBusinessListItemDto,
  type AdminBusinessOwnerSummaryDto,
  type AdminBusinessSubscriptionIndicatorDto,
  type AdminCardListItemDto,
  type AdminConfigEntryDto,
  type AdminIntroductionListItemDto,
  type AdminInvoiceDto,
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
  type DashboardActivityItemDto,
  type DashboardCountryStatDto,
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
  AdminIntroductionListInput,
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
  AdminStaffCreateInput,
  StaffDeactivateInput,
  StaffPasswordResetInput,
  StaffRoleUpdateInput,
} from '@kclub/validation';

import { createDbAuditService } from '@/server/audit';
import type { RequestContext } from '@/server/context';
import { getDbClient, schema } from '@/server/db';
import { AppError } from '@/server/errors';
import { getStripeClient } from '@/server/stripe/client';
import { listPaidVipInvoices } from '@/server/stripe/invoice-receipts';
import { getStripeSubscriptionPeriod } from '@/server/stripe/subscription-period';
import { revokeCard, reissueCard, toMemberCardDto } from './card-service';
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

async function assertAnotherActiveOwnerExists(staffId: string): Promise<void> {
  const db = getDbClient();
  const activeOwnerCount = await db.$count(
    schema.adminUsers,
    and(
      eq(schema.adminUsers.role, 'OWNER'),
      eq(schema.adminUsers.is_active, true),
      not(eq(schema.adminUsers.id, staffId)),
    ),
  );

  if (activeOwnerCount === 0) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_CONFLICT,
      message: 'Cannot remove the last active owner',
      status: 409,
    });
  }
}

// ── Dashboard Metrics ──

export async function getDashboardMetrics(): Promise<DashboardMetricsDto> {
  const db = getDbClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const numberOrZero = (result: PromiseSettledResult<number>): number =>
    result.status === 'fulfilled' ? result.value : 0;

  const arrayOrEmpty = <T>(result: PromiseSettledResult<T[]>): T[] =>
    result.status === 'fulfilled' ? result.value : [];

  const countResults = await Promise.allSettled([
    db.$count(schema.users),
    db.$count(schema.users, eq(schema.users.status, 'BLOCKED')),
    db.$count(schema.vipSubscriptions, eq(schema.vipSubscriptions.status, 'ACTIVE')),
    db.$count(schema.vipSubscriptions, eq(schema.vipSubscriptions.status, 'PAST_DUE')),
    db.$count(schema.vipSubscriptions, eq(schema.vipSubscriptions.status, 'EXPIRED')),
    db.$count(schema.businessProfiles, eq(schema.businessProfiles.status, 'UNDER_REVIEW')),
    db.$count(schema.businessIntroductions, eq(schema.businessIntroductions.status, 'SUBMITTED')),
    db.$count(schema.businessIntroductions, eq(schema.businessIntroductions.status, 'IN_REVIEW')),
    db.$count(schema.businessProfiles),
    db.$count(schema.businessProfiles, eq(schema.businessProfiles.status, 'PUBLISHED')),
    db.$count(schema.users, gte(schema.users.created_at, sevenDaysAgo)),
    db.$count(schema.businessProfiles, gte(schema.businessProfiles.created_at, sevenDaysAgo)),
  ]);

  const [recentUsersResult, recentBusinessesResult, recentIntroductionsResult] =
    await Promise.allSettled([
      db
        .select({
          displayName: schema.users.display_name,
          phone: schema.users.phone,
          createdAt: schema.users.created_at,
        })
        .from(schema.users)
        .orderBy(desc(schema.users.created_at))
        .limit(10),
      db
        .select({
          name: schema.businessProfiles.name,
          createdAt: schema.businessProfiles.created_at,
        })
        .from(schema.businessProfiles)
        .orderBy(desc(schema.businessProfiles.created_at))
        .limit(10),
      db
        .select({
          clientName: schema.businessIntroductions.client_name,
          targetName: schema.businessProfiles.name,
          createdAt: schema.businessIntroductions.created_at,
        })
        .from(schema.businessIntroductions)
        .innerJoin(
          schema.businessProfiles,
          eq(schema.businessIntroductions.target_business_id, schema.businessProfiles.id),
        )
        .orderBy(desc(schema.businessIntroductions.created_at))
        .limit(10),
    ]);

  const totalUsers = numberOrZero(countResults[0]);
  const blockedUsers = numberOrZero(countResults[1]);
  const activeSubs = numberOrZero(countResults[2]);
  const pastDueSubs = numberOrZero(countResults[3]);
  const expiredSubs = numberOrZero(countResults[4]);
  const businessesReview = numberOrZero(countResults[5]);
  const introductionsSubmitted = numberOrZero(countResults[6]);
  const introductionsInReview = numberOrZero(countResults[7]);
  const totalBusinesses = numberOrZero(countResults[8]);
  const publishedBusinesses = numberOrZero(countResults[9]);
  const newUsers7d = numberOrZero(countResults[10]);
  const newBusinesses7d = numberOrZero(countResults[11]);
  const recentUsers = arrayOrEmpty(recentUsersResult);
  const recentBusinesses = arrayOrEmpty(recentBusinessesResult);
  const recentIntroductions = arrayOrEmpty(recentIntroductionsResult);

  const [usersByCountryResult, businessesByCountryResult] = await Promise.allSettled([
    db
      .select({
        country: schema.users.country,
        cnt: count(),
      })
      .from(schema.users)
      .where(not(isNull(schema.users.country)))
      .groupBy(schema.users.country)
      .orderBy(desc(count()))
      .limit(10),
    db
      .select({
        countryId: schema.businessProfiles.country_id,
        countryName: schema.countries.name,
        code2: schema.countries.code2,
        cnt: count(),
      })
      .from(schema.businessProfiles)
      .innerJoin(schema.countries, eq(schema.businessProfiles.country_id, schema.countries.id))
      .groupBy(schema.businessProfiles.country_id, schema.countries.name, schema.countries.code2)
      .orderBy(desc(count()))
      .limit(10),
  ]);

  const usersByCountry = arrayOrEmpty(usersByCountryResult);
  const businessesByCountry = arrayOrEmpty(businessesByCountryResult);

  const countryMap = new Map<string, DashboardCountryStatDto>();
  for (const row of usersByCountry) {
    if (!row.country) continue;
    countryMap.set(row.country, {
      country: row.country,
      code2: null,
      users: row.cnt,
      businesses: 0,
    });
  }
  for (const row of businessesByCountry) {
    const existing = countryMap.get(row.countryName);
    if (existing) {
      existing.businesses = row.cnt;
      existing.code2 = row.code2;
    } else {
      countryMap.set(row.countryName, {
        country: row.countryName,
        code2: row.code2,
        users: 0,
        businesses: row.cnt,
      });
    }
  }
  // Back-fill code2 for user-only countries
  if (countryMap.size > 0) {
    const namesWithoutCode = [...countryMap.values()]
      .filter((c) => c.code2 === null)
      .map((c) => c.country);
    if (namesWithoutCode.length > 0) {
      const codeRows = await db
        .select({ name: schema.countries.name, code2: schema.countries.code2 })
        .from(schema.countries)
        .where(inArray(schema.countries.name, namesWithoutCode));
      for (const cr of codeRows) {
        const entry = countryMap.get(cr.name);
        if (entry) entry.code2 = cr.code2;
      }
    }
  }
  const topCountries: DashboardCountryStatDto[] = [...countryMap.values()]
    .sort((a, b) => b.users + b.businesses - (a.users + a.businesses))
    .slice(0, 5);

  const recentActivity: DashboardActivityItemDto[] = [
    ...recentUsers.map((user) => ({
      type: 'USER_REGISTERED' as const,
      title: user.displayName ?? user.phone,
      timestamp: user.createdAt.toISOString(),
    })),
    ...recentBusinesses.map((business) => ({
      type: 'BUSINESS_SUBMITTED' as const,
      title: business.name,
      timestamp: business.createdAt.toISOString(),
    })),
    ...recentIntroductions.map((intro) => ({
      type: 'INTRODUCTION_SUBMITTED' as const,
      title: intro.clientName ? `${intro.clientName} → ${intro.targetName}` : intro.targetName,
      timestamp: intro.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 10);

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
    totalBusinesses,
    publishedBusinesses,
    newUsers7d,
    newBusinesses7d,
    recentActivity,
    topCountries,
  };
}

// ── Users ──

export async function listUsers(
  params: AdminUserListInput,
): Promise<{ data: AdminUserListItemDto[]; total: number }> {
  const db = getDbClient();

  const conditions = [];

  if (params.search) {
    conditions.push(
      or(
        ilike(schema.users.phone, `%${params.search}%`),
        ilike(schema.users.display_name, `%${params.search}%`),
      ),
    );
  }

  if (params.status) {
    conditions.push(eq(schema.users.status, params.status));
  }

  if (params.membershipTier) {
    conditions.push(eq(schema.users.membership_tier, params.membershipTier));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [users, total] = await Promise.all([
    db.query.users.findMany({
      where: whereClause,
      orderBy: [desc(schema.users.created_at)],
      offset: (params.page - 1) * params.limit,
      limit: params.limit,
    }),
    db.$count(schema.users, whereClause),
  ]);

  return { data: users.map(toAdminUserListItem), total };
}

export async function getUserDetail(userId: string): Promise<AdminUserDetailDto> {
  const db = getDbClient();

  const [user, cards, subscriptions, auditEntries] = await Promise.all([
    db.query.users.findFirst({ where: eq(schema.users.id, userId) }),
    db.query.memberCards.findMany({
      where: eq(schema.memberCards.user_id, userId),
      orderBy: [desc(schema.memberCards.issued_at)],
    }),
    db.query.vipSubscriptions.findMany({
      where: eq(schema.vipSubscriptions.user_id, userId),
      orderBy: [desc(schema.vipSubscriptions.created_at)],
    }),
    db.query.auditLogs.findMany({
      where: eq(schema.auditLogs.entity_id, userId),
      orderBy: [desc(schema.auditLogs.created_at)],
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

export async function listUserInvoices(userId: string): Promise<AdminInvoiceDto[]> {
  const db = getDbClient();

  const [user, subscriptions] = await Promise.all([
    db.query.users.findFirst({ where: eq(schema.users.id, userId) }),
    db.query.vipSubscriptions.findMany({
      where: eq(schema.vipSubscriptions.user_id, userId),
      orderBy: [desc(schema.vipSubscriptions.created_at)],
    }),
  ]);

  if (!user) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'User not found',
      status: 404,
    });
  }

  const stripeCustomerId = subscriptions.find(
    (subscription) => subscription.stripe_customer_id,
  )?.stripe_customer_id;
  const stripeSubscriptionIds = subscriptions.flatMap((subscription) =>
    subscription.stripe_subscription_id ? [subscription.stripe_subscription_id] : [],
  );

  if (!stripeCustomerId || stripeSubscriptionIds.length === 0) return [];

  return listPaidVipInvoices(stripeCustomerId, stripeSubscriptionIds);
}

export async function syncVipSubscriptionForUser(
  userId: string,
  context: RequestContext,
): Promise<AdminUserDetailDto> {
  const db = getDbClient();
  const stripe = getStripeClient();

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'User not found',
      status: 404,
    });
  }

  const existingLocal = await db.query.vipSubscriptions.findFirst({
    where: eq(schema.vipSubscriptions.user_id, userId),
    orderBy: [desc(schema.vipSubscriptions.created_at)],
  });

  if (!existingLocal?.stripe_subscription_id && !existingLocal?.stripe_customer_id) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message:
        'No Stripe identifiers found locally. Ask the user to revisit the checkout success page, or enter the subscription ID manually in Stripe dashboard.',
      status: 404,
    });
  }

  let stripeSub;
  if (existingLocal.stripe_subscription_id) {
    stripeSub = await stripe.subscriptions.retrieve(existingLocal.stripe_subscription_id);
  } else {
    const list = await stripe.subscriptions.list({
      customer: existingLocal.stripe_customer_id!,
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

  const subscriptionPeriod = getStripeSubscriptionPeriod(stripeSub.items.data[0]);
  const newStatus =
    mapStripeStatusToLocal(stripeSub.status, subscriptionPeriod.currentPeriodEndTimestamp) ??
    'ACTIVE';

  const resolvedCustomerId =
    existingLocal?.stripe_customer_id ??
    (typeof stripeSub.customer === 'string' ? stripeSub.customer : null);

  let localSub;
  if (existingLocal) {
    const [updated] = await db
      .update(schema.vipSubscriptions)
      .set({
        status: newStatus,
        stripe_customer_id: resolvedCustomerId,
        stripe_subscription_id: stripeSub.id,
        current_period_start: subscriptionPeriod.currentPeriodStart,
        current_period_end: subscriptionPeriod.currentPeriodEnd,
        cancel_at_period_end: stripeSub.cancel_at_period_end,
      })
      .where(eq(schema.vipSubscriptions.id, existingLocal.id))
      .returning();
    localSub = updated;
  } else {
    const [created] = await db
      .insert(schema.vipSubscriptions)
      .values({
        user_id: userId,
        status: newStatus,
        stripe_customer_id: resolvedCustomerId,
        stripe_subscription_id: stripeSub.id,
        current_period_start: subscriptionPeriod.currentPeriodStart,
        current_period_end: subscriptionPeriod.currentPeriodEnd,
        cancel_at_period_end: stripeSub.cancel_at_period_end,
      })
      .returning();
    localSub = created;
  }

  await db
    .update(schema.users)
    .set({ membership_tier: newStatus === 'ACTIVE' || newStatus === 'PAST_DUE' ? 'VIP' : 'MEMBER' })
    .where(eq(schema.users.id, userId));

  await auditService.log(
    {
      action: 'STRIPE_WEBHOOK_REPLAYED',
      entityType: 'VipSubscription',
      entityId: userId,
      after: { subscriptionId: localSub!.id, status: newStatus },
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

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
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
    await tx
      .update(schema.memberCards)
      .set({
        status: 'REVOKED',
        revoked_at: new Date(),
        revoked_reason: input.reason ?? 'User blocked',
      })
      .where(and(eq(schema.memberCards.user_id, userId), eq(schema.memberCards.status, 'ACTIVE')));

    const [u] = await tx
      .update(schema.users)
      .set({ status: 'BLOCKED' })
      .where(eq(schema.users.id, userId))
      .returning();

    return [u];
  });

  await auditService.log(
    {
      action: 'USER_BLOCKED',
      entityType: 'User',
      entityId: userId,
      before: { status: user.status },
      after: { status: updated!.status },
    },
    context,
  );

  return toAdminUserDetail(updated!);
}

export async function unblockUser(
  userId: string,
  input: UnblockUserInput,
  context: RequestContext,
): Promise<AdminUserDetailDto> {
  const db = getDbClient();

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
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

  const [updated] = await db
    .update(schema.users)
    .set({ status: 'ACTIVE' })
    .where(eq(schema.users.id, userId))
    .returning();

  await auditService.log(
    {
      action: 'USER_UNBLOCKED',
      entityType: 'User',
      entityId: userId,
      before: { status: user.status },
      after: { status: updated!.status },
    },
    context,
  );

  return toAdminUserDetail(updated!);
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
    conditions.push(eq(schema.memberCards.membership_tier, params.membershipTier));
  }

  if (params.search) {
    // We need to join users to search by user phone or display_name
    // But we are using query API which filters on relations using the nested syntax in Prisma, but in Drizzle we can't easily filter by relation fields in query API without a join.
    // Instead, we will use a subquery or join.
    conditions.push(
      exists(
        db
          .select()
          .from(schema.users)
          .where(
            and(
              eq(schema.users.id, schema.memberCards.user_id),
              or(
                ilike(schema.users.phone, `%${params.search}%`),
                ilike(schema.users.display_name, `%${params.search}%`),
              ),
            ),
          ),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [cards, total] = await Promise.all([
    // Note: To use with: { user: true }, relations must be defined in relations.ts
    // We assume they are or will be added.
    db.query.memberCards.findMany({
      where: whereClause,
      with: { user: { columns: { phone: true, display_name: true } } },
      orderBy: [desc(schema.memberCards.issued_at)],
      offset: (params.page - 1) * params.limit,
      limit: params.limit,
    }),
    db.$count(schema.memberCards, whereClause),
  ]);

  return { data: cards.map(toAdminCardListItem), total };
}

export async function getCardDetail(cardId: string): Promise<MemberCardDto> {
  const db = getDbClient();
  const card = await db.query.memberCards.findFirst({ where: eq(schema.memberCards.id, cardId) });
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
  const card = await db.query.memberCards.findFirst({ where: eq(schema.memberCards.id, cardId) });
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
      before: { status: card.status, userId: card.user_id },
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
  const card = await db.query.memberCards.findFirst({ where: eq(schema.memberCards.id, cardId) });
  if (!card) {
    throw new AppError({
      code: ERROR_CODES.CARD_NOT_FOUND,
      message: 'Card not found',
      status: 404,
    });
  }

  const newCard = await reissueCard(card.user_id, card.membership_tier, cardId, input.reason);

  await auditService.log(
    {
      action: 'CARD_ISSUED',
      entityType: 'MemberCard',
      entityId: newCard.id,
      before: { revokedCardId: cardId },
      after: { cardNumber: newCard.card_number, status: newCard.status },
    },
    context,
  );

  return toMemberCardDto(newCard);
}

// ── Businesses ──

const BUSINESS_LIST_INCLUDE = {
  category: { with: { parent: { with: { parent: true } } } },
  country: true,
  city: true,
  user: {
    columns: { id: true, phone: true, display_name: true, status: true, membership_tier: true },
  },
  subscriptions: {
    where: (subs: any, { eq }: any) => eq(subs.kind, 'BUSINESS_PLACEMENT'),
    orderBy: (subs: any, { desc }: any) => [desc(subs.created_at)],
    limit: 1,
  },
};

export async function listBusinesses(
  params: AdminBusinessListInput,
): Promise<{ data: AdminBusinessListItemDto[]; total: number }> {
  const db = getDbClient();

  const conditions = [];
  if (params.status) {
    conditions.push(eq(schema.businessProfiles.status, params.status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [businesses, total] = await Promise.all([
    db.query.businessProfiles.findMany({
      where: whereClause,
      with: BUSINESS_LIST_INCLUDE as any,
      orderBy: [desc(schema.businessProfiles.created_at)],
      offset: (params.page - 1) * params.limit,
      limit: params.limit,
    }),
    db.$count(schema.businessProfiles, whereClause),
  ]);

  return { data: businesses.map(toAdminBusinessListItem), total };
}

const BUSINESS_MUTATION_INCLUDE = {
  category: { with: { parent: { with: { parent: true } } } },
  country: true,
  city: true,
  user: {
    columns: { id: true, phone: true, display_name: true, status: true, membership_tier: true },
  },
  subscriptions: {
    where: (subs: any, { eq }: any) => eq(subs.kind, 'BUSINESS_PLACEMENT'),
    orderBy: (subs: any, { desc }: any) => [desc(subs.created_at)],
    limit: 1,
  },
};

const BUSINESS_DETAIL_INCLUDE = {
  category: { with: { parent: { with: { parent: true } } } },
  country: true,
  city: true,
  user: {
    columns: { id: true, phone: true, display_name: true, status: true, membership_tier: true },
  },
  subscriptions: {
    where: (subs: any, { eq }: any) => eq(subs.kind, 'BUSINESS_PLACEMENT'),
    orderBy: (subs: any, { desc }: any) => [desc(subs.created_at)],
    limit: 1,
  },
};

export async function getBusinessDetail(businessId: string): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_DETAIL_INCLUDE as any,
  });
  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  const auditEntries = await db.query.auditLogs.findMany({
    where: and(
      eq(schema.auditLogs.entity_type, 'BusinessProfile'),
      eq(schema.auditLogs.entity_id, businessId),
    ),
    orderBy: [desc(schema.auditLogs.created_at)],
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
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE as any,
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  const [updated] = await db
    .update(schema.businessProfiles)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.representativeName !== undefined && {
        representative_name: input.representativeName,
      }),
      ...(input.representativeEmail !== undefined && {
        representative_email: input.representativeEmail,
      }),
      ...(input.representativePhone !== undefined && {
        representative_phone: input.representativePhone,
      }),
      ...(input.websiteUrl !== undefined && { website_url: input.websiteUrl }),
      ...(input.socialUrl !== undefined && { social_url: input.socialUrl }),
      ...(input.briefDescription !== undefined && { brief_description: input.briefDescription }),
      updated_at: new Date(),
    })
    .where(eq(schema.businessProfiles.id, businessId))
    .returning();

  const updatedWithRelations = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE as any,
  });

  await auditService.log(
    {
      action: 'BUSINESS_UPDATED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: {
        name: business.name,
        representativeEmail: business.representative_email,
      },
      after: { name: updated!.name, representativeEmail: updated!.representative_email },
    },
    context,
  );

  return toAdminBusinessDetail(updatedWithRelations!);
}

export async function approveBusiness(
  businessId: string,
  input: BusinessApproveInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE as any,
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

  const [updated] = await db
    .update(schema.businessProfiles)
    .set({
      status: 'APPROVED',
      approved_at: new Date(),
      internal_notes: input.notes ?? business.internal_notes,
    })
    .where(eq(schema.businessProfiles.id, businessId))
    .returning();

  const updatedWithRelations = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE as any,
  });

  await auditService.log(
    {
      action: 'BUSINESS_APPROVED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: { status: business.status },
      after: { status: updated!.status },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  const auditEntries = await db.query.auditLogs.findMany({
    where: and(
      eq(schema.auditLogs.entity_type, 'BusinessProfile'),
      eq(schema.auditLogs.entity_id, businessId),
    ),
    orderBy: [desc(schema.auditLogs.created_at)],
    limit: 50,
  });

  return toAdminBusinessDetail(updatedWithRelations!, auditEntries);
}

export async function publishBusiness(
  businessId: string,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE as any,
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

  const [updated] = await db
    .update(schema.businessProfiles)
    .set({
      status: 'PUBLISHED',
      published_at: new Date(),
    })
    .where(eq(schema.businessProfiles.id, businessId))
    .returning();

  const updatedWithRelations = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE as any,
  });

  await auditService.log(
    {
      action: 'BUSINESS_PUBLISHED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: { status: business.status },
      after: { status: updated!.status },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  const auditEntries = await db.query.auditLogs.findMany({
    where: and(
      eq(schema.auditLogs.entity_type, 'BusinessProfile'),
      eq(schema.auditLogs.entity_id, businessId),
    ),
    orderBy: [desc(schema.auditLogs.created_at)],
    limit: 50,
  });

  return toAdminBusinessDetail(updatedWithRelations!, auditEntries);
}

export async function rejectBusiness(
  businessId: string,
  input: BusinessRejectInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE as any,
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

  const [updated] = await db
    .update(schema.businessProfiles)
    .set({
      status: 'REJECTED',
      rejection_reason: input.reason,
      rejected_at: new Date(),
    })
    .where(eq(schema.businessProfiles.id, businessId))
    .returning();

  const updatedWithRelations = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE as any,
  });

  await auditService.log(
    {
      action: 'BUSINESS_REJECTED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: { status: business.status },
      after: { status: updated!.status, reason: input.reason },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return toAdminBusinessDetail(updatedWithRelations!);
}

export async function hideBusiness(
  businessId: string,
  input: BusinessHideInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE as any,
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

  const [updated] = await db
    .update(schema.businessProfiles)
    .set({
      status: 'HIDDEN',
      hidden_at: new Date(),
      featured_top: false,
      featured_recommended: false,
    })
    .where(eq(schema.businessProfiles.id, businessId))
    .returning();

  const updatedWithRelations = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE as any,
  });

  await auditService.log(
    {
      action: 'BUSINESS_HIDDEN',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: {
        status: business.status,
        featuredTop: business.featured_top,
        featuredRecommended: business.featured_recommended,
      },
      after: { status: updated!.status, featuredTop: false, featuredRecommended: false },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return toAdminBusinessDetail(updatedWithRelations!);
}

export async function updateBusinessFeatured(
  businessId: string,
  input: BusinessFeaturedInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const db = getDbClient();

  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE as any,
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  const setTop = input.featuredTop;
  const setRecommended = input.featuredRecommended;
  const setDiscount = input.memberDiscountPercent;
  const setDiscountMuted = input.discountMuted;

  if (
    (setTop !== undefined || setRecommended !== undefined) &&
    !canFeatureBusiness(business.status as BusinessStatus)
  ) {
    throw new AppError({
      code: ERROR_CODES.FEATURED_BUSINESS_NOT_PUBLISHED,
      message: 'Only PUBLISHED businesses can be featured',
      status: 409,
    });
  }

  const [updated] = await db.transaction(async (tx) => {
    if (setTop !== undefined && setTop !== business.featured_top) {
      if (setTop) {
        const currentTopCount = await tx.$count(
          schema.businessProfiles,
          and(
            eq(schema.businessProfiles.featured_top, true),
            not(eq(schema.businessProfiles.id, businessId)),
          ),
        );
        if (
          !canSetFeaturedFlag(
            business.status as BusinessStatus,
            true,
            currentTopCount,
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

    if (setRecommended !== undefined && setRecommended !== business.featured_recommended) {
      if (setRecommended) {
        const currentRecommendedCount = await tx.$count(
          schema.businessProfiles,
          and(
            eq(schema.businessProfiles.featured_recommended, true),
            not(eq(schema.businessProfiles.id, businessId)),
          ),
        );
        if (
          !canSetFeaturedFlag(
            business.status as BusinessStatus,
            true,
            currentRecommendedCount,
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

    const [b] = await tx
      .update(schema.businessProfiles)
      .set({
        featured_top: setTop !== undefined ? setTop : business.featured_top,
        featured_recommended:
          setRecommended !== undefined ? setRecommended : business.featured_recommended,
        ...(setDiscount !== undefined ? { member_discount_percent: setDiscount } : {}),
        ...(setDiscountMuted !== undefined ? { discount_muted: setDiscountMuted } : {}),
      })
      .where(eq(schema.businessProfiles.id, businessId))
      .returning();

    return [b];
  });

  const updatedWithRelations = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: BUSINESS_MUTATION_INCLUDE as any,
  });

  await auditService.log(
    {
      action: 'BUSINESS_FEATURED_UPDATED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: {
        featuredTop: business.featured_top,
        featuredRecommended: business.featured_recommended,
        memberDiscountPercent: business.member_discount_percent,
        discountMuted: business.discount_muted,
      },
      after: {
        featuredTop: updated!.featured_top,
        featuredRecommended: updated!.featured_recommended,
        memberDiscountPercent: updated!.member_discount_percent,
        discountMuted: updated!.discount_muted,
      },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return toAdminBusinessDetail(updatedWithRelations!);
}

// ── Introductions ──

const INTRODUCTION_LIST_INCLUDE = {
  requesterUser: { columns: { id: true, phone: true, display_name: true } },
  requesterBusiness: { columns: { id: true, name: true, slug: true } },
  targetBusiness: { columns: { id: true, name: true, slug: true } },
};

export async function listIntroductions(
  filters: Partial<AdminIntroductionListInput> = {},
): Promise<{ data: AdminIntroductionListItemDto[]; total: number }> {
  const db = getDbClient();
  const conditions = [];

  if (filters.businessId)
    conditions.push(eq(schema.businessIntroductions.target_business_id, filters.businessId));
  if (filters.status) conditions.push(eq(schema.businessIntroductions.status, filters.status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const [introductions, total] = await Promise.all([
    db.query.businessIntroductions.findMany({
      with: INTRODUCTION_LIST_INCLUDE as any,
      where: whereClause,
      orderBy: [desc(schema.businessIntroductions.created_at)],
      offset: (page - 1) * limit,
      limit: limit,
    }),
    db.$count(schema.businessIntroductions, whereClause),
  ]);

  return {
    data: introductions.map(toAdminIntroductionListItem),
    total,
  };
}

export async function getIntroductionDetail(
  introductionId: string,
): Promise<AdminIntroductionListItemDto> {
  const db = getDbClient();
  const intro = await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
    with: INTRODUCTION_LIST_INCLUDE as any,
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
  const intro = await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
  });
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

  const [updated] = await db
    .update(schema.businessIntroductions)
    .set({ status: 'APPROVED' })
    .where(eq(schema.businessIntroductions.id, introductionId))
    .returning();

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
  const intro = await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
  });
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

  const [updated] = await db
    .update(schema.businessIntroductions)
    .set({ status: 'REJECTED', rejection_reason: input.reason })
    .where(eq(schema.businessIntroductions.id, introductionId))
    .returning();

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
  const intro = await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
  });
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

  const [updated] = await db
    .update(schema.businessIntroductions)
    .set({ status: 'COMPLETED' })
    .where(eq(schema.businessIntroductions.id, introductionId))
    .returning();

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
  const categories = await db.query.categories.findMany({
    orderBy: [
      asc(schema.categories.level),
      asc(schema.categories.sort_order),
      asc(schema.categories.name),
    ],
  });
  return categories.map(toCategoryDto);
}

export async function getCategory(categoryId: string): Promise<CategoryDto> {
  const db = getDbClient();
  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.id, categoryId),
  });
  if (!category) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Category not found',
      status: 404,
    });
  }
  return toCategoryDto(category);
}

async function assertCategoryParent(
  level: CategoryDto['level'],
  parentId: string | null,
  categoryId?: string,
): Promise<void> {
  const db = getDbClient();

  if (level === 'BLOCK') {
    if (parentId !== null) {
      throw new AppError({
        code: ERROR_CODES.VALIDATION_INVALID_INPUT,
        message: 'Block categories cannot have a parent',
        status: 400,
      });
    }
    return;
  }

  if (!parentId) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_INVALID_INPUT,
      message: `${level} categories require a parent`,
      status: 400,
    });
  }

  if (parentId === categoryId) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_INVALID_INPUT,
      message: 'Category cannot be its own parent',
      status: 400,
    });
  }

  const parent = await db.query.categories.findFirst({ where: eq(schema.categories.id, parentId) });
  const expectedParentLevel = level === 'CATEGORY' ? 'BLOCK' : 'CATEGORY';

  if (!parent || parent.level !== expectedParentLevel) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_INVALID_INPUT,
      message: `${level} parent must be ${expectedParentLevel}`,
      status: 400,
    });
  }
}

export async function createCategory(input: CategoryCreateInput): Promise<CategoryDto> {
  const db = getDbClient();
  await assertCategoryParent(input.level, input.parentId ?? null);

  const [category] = await db
    .insert(schema.categories)
    .values({
      parent_id: input.parentId ?? null,
      level: input.level,
      name: input.name,
      slug: input.slug,
      is_high_risk: input.isHighRisk ?? false,
      is_active: input.isActive ?? true,
      is_custom: input.isCustom ?? false,
      sort_order: input.sortOrder ?? 0,
    })
    .returning();
  revalidateTag('categories');
  return toCategoryDto(category);
}

export async function updateCategory(
  categoryId: string,
  input: CategoryUpdateInput,
): Promise<CategoryDto> {
  const db = getDbClient();
  const existing = await db.query.categories.findFirst({
    where: eq(schema.categories.id, categoryId),
  });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Category not found',
      status: 404,
    });
  }
  const nextLevel = input.level ?? (existing.level as CategoryDto['level']);
  const nextParentId =
    input.parentId !== undefined ? input.parentId : (existing.parent_id as string | null);
  await assertCategoryParent(nextLevel, nextParentId, categoryId);

  const [category] = await db
    .update(schema.categories)
    .set({
      ...(input.parentId !== undefined ? { parent_id: input.parentId } : {}),
      ...(input.level !== undefined ? { level: input.level } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.isHighRisk !== undefined ? { is_high_risk: input.isHighRisk } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      ...(input.isCustom !== undefined ? { is_custom: input.isCustom } : {}),
      ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    })
    .where(eq(schema.categories.id, categoryId))
    .returning();
  revalidateTag('categories');
  return toCategoryDto(category);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const db = getDbClient();
  const existing = await db.query.categories.findFirst({
    where: eq(schema.categories.id, categoryId),
  });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Category not found',
      status: 404,
    });
  }
  await db
    .update(schema.categories)
    .set({ is_active: false })
    .where(eq(schema.categories.id, categoryId));
  revalidateTag('categories');
}

export async function listCountries(): Promise<CountryDto[]> {
  const db = getDbClient();
  const countries = await db.query.countries.findMany({ orderBy: [asc(schema.countries.name)] });
  return countries.map(toCountryDto);
}

export async function getCountry(countryId: string): Promise<CountryDto> {
  const db = getDbClient();
  const country = await db.query.countries.findFirst({ where: eq(schema.countries.id, countryId) });
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
  const [country] = await db
    .insert(schema.countries)
    .values({
      code2: input.code2,
      code3: input.code3 ?? null,
      name: input.name,
      slug: input.slug,
      is_active: input.isActive ?? true,
    })
    .returning();
  revalidateTag('countries');
  return toCountryDto(country);
}

export async function updateCountry(
  countryId: string,
  input: CountryUpdateInput,
): Promise<CountryDto> {
  const db = getDbClient();
  const existing = await db.query.countries.findFirst({
    where: eq(schema.countries.id, countryId),
  });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Country not found',
      status: 404,
    });
  }

  const [country] = await db
    .update(schema.countries)
    .set({
      ...(input.code2 !== undefined ? { code2: input.code2 } : {}),
      ...(input.code3 !== undefined ? { code3: input.code3 } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
    })
    .where(eq(schema.countries.id, countryId))
    .returning();
  revalidateTag('countries');
  return toCountryDto(country);
}

export async function deleteCountry(countryId: string): Promise<void> {
  const db = getDbClient();
  const existing = await db.query.countries.findFirst({
    where: eq(schema.countries.id, countryId),
  });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Country not found',
      status: 404,
    });
  }
  await db.delete(schema.countries).where(eq(schema.countries.id, countryId));
  revalidateTag('countries');
}

export async function listCities(): Promise<CityDto[]> {
  const db = getDbClient();
  const cities = await db.query.cities.findMany({
    with: { country: { columns: { id: true, name: true } } },
    orderBy: [asc(schema.cities.name)],
  });
  return cities.map(toCityDto);
}

export async function getCity(cityId: string): Promise<CityDto> {
  const db = getDbClient();
  const city = await db.query.cities.findFirst({
    where: eq(schema.cities.id, cityId),
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
  const country = await db.query.countries.findFirst({
    where: eq(schema.countries.id, input.countryId),
  });
  if (!country) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Country not found',
      status: 404,
    });
  }

  const [inserted] = await db
    .insert(schema.cities)
    .values({
      country_id: input.countryId,
      name: input.name,
      slug: input.slug,
      is_active: input.isActive ?? true,
    })
    .returning();

  const city = await db.query.cities.findFirst({
    where: eq(schema.cities.id, inserted!.id),
    with: { country: { columns: { id: true, name: true } } },
  });
  revalidateTag('cities');
  return toCityDto(city!);
}

export async function updateCity(cityId: string, input: CityUpdateInput): Promise<CityDto> {
  const db = getDbClient();
  const existing = await db.query.cities.findFirst({ where: eq(schema.cities.id, cityId) });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'City not found',
      status: 404,
    });
  }

  if (input.countryId !== undefined) {
    const country = await db.query.countries.findFirst({
      where: eq(schema.countries.id, input.countryId),
    });
    if (!country) {
      throw new AppError({
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Country not found',
        status: 404,
      });
    }
  }

  await db
    .update(schema.cities)
    .set({
      ...(input.countryId !== undefined ? { country_id: input.countryId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
    })
    .where(eq(schema.cities.id, cityId));

  const city = await db.query.cities.findFirst({
    where: eq(schema.cities.id, cityId),
    with: { country: { columns: { id: true, name: true } } },
  });
  revalidateTag('cities');
  return toCityDto(city!);
}

export async function deleteCity(cityId: string): Promise<void> {
  const db = getDbClient();
  const existing = await db.query.cities.findFirst({ where: eq(schema.cities.id, cityId) });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'City not found',
      status: 404,
    });
  }
  await db.delete(schema.cities).where(eq(schema.cities.id, cityId));
  revalidateTag('cities');
}

// ── Subscriptions (Admin Read) ──

export async function listSubscriptions(): Promise<SubscriptionDto[]> {
  const db = getDbClient();
  const subs = await db.query.vipSubscriptions.findMany({
    orderBy: [desc(schema.vipSubscriptions.created_at)],
  });
  return subs.map(toSubscriptionDto);
}

const ADMIN_SUBSCRIPTION_INCLUDE = {
  user: { columns: { id: true, phone: true, display_name: true, membership_tier: true } },
  businessProfile: { columns: { name: true } },
};

export async function listAdminSubscriptions(): Promise<AdminSubscriptionListItemDto[]> {
  const db = getDbClient();
  const subs = await db.query.subscriptions.findMany({
    with: ADMIN_SUBSCRIPTION_INCLUDE as any,
    orderBy: [desc(schema.subscriptions.created_at)],
  });
  return subs.map(toAdminSubscriptionListItem);
}

export async function getAdminSubscriptionDetail(
  subscriptionId: string,
): Promise<AdminSubscriptionListItemDto> {
  const db = getDbClient();
  const sub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.id, subscriptionId),
    with: ADMIN_SUBSCRIPTION_INCLUDE as any,
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
  const sub = await db.query.vipSubscriptions.findFirst({
    where: eq(schema.vipSubscriptions.id, subscriptionId),
  });
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
    where: eq(schema.subscriptions.id, subscriptionId),
    with: ADMIN_SUBSCRIPTION_INCLUDE as any,
  });
  if (!sub) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Subscription not found',
      status: 404,
    });
  }

  const [updated] = await db
    .update(schema.subscriptions)
    .set({ cancel_at_period_end: true, canceled_at: new Date() })
    .where(eq(schema.subscriptions.id, subscriptionId))
    .returning();

  const updatedWithRelations = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.id, subscriptionId),
    with: ADMIN_SUBSCRIPTION_INCLUDE as any,
  });

  await auditService.log(
    {
      action: 'SUBSCRIPTION_CANCELED',
      entityType: 'Subscription',
      entityId: subscriptionId,
      before: { cancelAtPeriodEnd: sub.cancel_at_period_end },
      after: { cancelAtPeriodEnd: true },
    },
    context,
  );

  return toAdminSubscriptionListItem(updatedWithRelations!);
}

// ── Audit Log ──

export async function listAuditLogs(
  filters: Partial<AuditLogListInput> = {},
): Promise<{ data: AuditLogDto[]; total: number }> {
  const db = getDbClient();
  const conditions = [];

  if (filters.action) conditions.push(eq(schema.auditLogs.action, filters.action));
  if (filters.actorRole) conditions.push(eq(schema.auditLogs.actor_role, filters.actorRole as any));
  if (filters.actorStaffId)
    conditions.push(eq(schema.auditLogs.actor_staff_id, filters.actorStaffId));
  if (filters.entityType)
    conditions.push(ilike(schema.auditLogs.entity_type, `%${filters.entityType}%`));
  if (filters.dateFrom) conditions.push(sql`${schema.auditLogs.created_at} >= ${filters.dateFrom}`);
  if (filters.dateTo) conditions.push(sql`${schema.auditLogs.created_at} <= ${filters.dateTo}`);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const [logs, total] = await Promise.all([
    db.query.auditLogs.findMany({
      where: whereClause,
      orderBy: [desc(schema.auditLogs.created_at)],
      offset: (page - 1) * limit,
      limit: limit,
    }),
    db.$count(schema.auditLogs, whereClause),
  ]);

  return {
    data: logs.map((log: any) => ({
      id: log.id,
      actorStaffId: log.actor_staff_id ?? null,
      actorRole: log.actor_role as any,
      action: log.action as any,
      entityType: log.entity_type,
      entityId: log.entity_id,
      before: log.before_data as Record<string, unknown> | null,
      after: log.after_data as Record<string, unknown> | null,
      ipAddress: log.ip_address ?? null,
      createdAt: log.created_at?.toISOString() ?? new Date().toISOString(),
    })),
    total,
  };
}

// ── Stripe Price Config (OWNER) ──

export const STRIPE_PRICE_KEYS = [
  'stripe_price_vip_membership_monthly',
  'stripe_price_business_placement_monthly',
] as const;

export type StripePriceKey = (typeof STRIPE_PRICE_KEYS)[number];

export type StripePricesMap = Record<StripePriceKey, string | null>;

function isStripePriceKey(key: string): key is StripePriceKey {
  return STRIPE_PRICE_KEYS.includes(key as StripePriceKey);
}

function normalizeAdminConfigValue(key: string, value: unknown): unknown {
  if (!isStripePriceKey(key)) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  return { priceId: value.trim() };
}

export async function getStripePrices(): Promise<StripePricesMap> {
  const db = getDbClient();
  const configs = await db.query.adminConfigs.findMany({
    where: inArray(schema.adminConfigs.key, STRIPE_PRICE_KEYS as unknown as string[]),
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
    if (!isStripePriceKey(key)) continue;

    const existing = await db.query.adminConfigs.findFirst({
      where: eq(schema.adminConfigs.key, key),
    });
    if (existing) {
      await db
        .update(schema.adminConfigs)
        .set({ value: { priceId } })
        .where(eq(schema.adminConfigs.key, key));
    } else {
      await db.insert(schema.adminConfigs).values({
        key,
        value: { priceId },
        description: `Stripe Price ID for ${key.replace('stripe_price_', '')}`,
      });
    }
  }

  return getStripePrices();
}

export async function getAdminConfig(key: string): Promise<AdminConfigEntryDto> {
  const db = getDbClient();
  const config = await db.query.adminConfigs.findFirst({ where: eq(schema.adminConfigs.key, key) });
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
  const normalizedValue = normalizeAdminConfigValue(key, input.value);
  const existing = await db.query.adminConfigs.findFirst({
    where: eq(schema.adminConfigs.key, key),
  });

  let result;
  if (existing) {
    const [updated] = await db
      .update(schema.adminConfigs)
      .set({
        value: normalizedValue,
        description: input.description ?? existing.description,
      })
      .where(eq(schema.adminConfigs.key, key))
      .returning();
    result = updated;
  } else {
    const [created] = await db
      .insert(schema.adminConfigs)
      .values({
        key,
        value: normalizedValue,
        description: input.description ?? null,
      })
      .returning();
    result = created;
  }
  return toAdminConfigEntry(result);
}

export async function getMembershipPlans(): Promise<MembershipPlanDto[]> {
  const db = getDbClient();
  const configs = await db.query.adminConfigs.findMany({
    where: inArray(schema.adminConfigs.key, [
      'vip_membership_monthly',
      'business_placement_monthly',
    ]),
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
    orderBy: [asc(schema.adminUsers.created_at)],
  });
  return staff.map(toAdminStaffListItem);
}

export async function createStaff(
  input: AdminStaffCreateInput,
  context: RequestContext,
): Promise<AdminStaffListItemDto> {
  const db = getDbClient();
  const existing = await db.query.adminUsers.findFirst({
    where: eq(schema.adminUsers.phone, input.phone),
  });
  if (existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_CONFLICT,
      message: 'Staff phone is already approved',
      status: 409,
    });
  }

  const [created] = await db
    .insert(schema.adminUsers)
    .values({
      phone: input.phone,
      role: input.role,
      display_name: input.displayName ?? null,
      is_active: true,
    })
    .returning();

  await auditService.log(
    {
      action: 'STAFF_CREATED',
      entityType: 'AdminUser',
      entityId: created!.id,
      before: null,
      after: {
        phone: created!.phone,
        role: created!.role,
        displayName: created!.display_name,
        passwordStatus: 'NOT_SET',
      },
    },
    context,
  );

  return toAdminStaffListItem(created!);
}

export async function getStaffDetail(staffId: string): Promise<AdminStaffListItemDto> {
  assertValidUuid(staffId, 'staff');
  const db = getDbClient();
  const staff = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, staffId) });
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
  const staff = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, staffId) });
  if (!staff) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Staff not found',
      status: 404,
    });
  }

  if (staff.role === 'OWNER' && input.role !== 'OWNER') {
    await assertAnotherActiveOwnerExists(staffId);
  }

  const [updated] = await db
    .update(schema.adminUsers)
    .set({ role: input.role })
    .where(eq(schema.adminUsers.id, staffId))
    .returning();

  await auditService.log(
    {
      action: 'STAFF_ROLE_UPDATED',
      entityType: 'AdminUser',
      entityId: staffId,
      before: { role: staff.role },
      after: { role: updated!.role },
    },
    context,
  );

  return toAdminStaffListItem(updated!);
}

export async function deactivateStaff(
  staffId: string,
  input: StaffDeactivateInput,
  context: RequestContext,
): Promise<AdminStaffListItemDto> {
  assertValidUuid(staffId, 'staff');
  const db = getDbClient();
  const staff = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, staffId) });
  if (!staff) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Staff not found',
      status: 404,
    });
  }

  if (!staff.is_active) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_CONFLICT,
      message: 'Staff is already inactive',
      status: 409,
    });
  }

  if (staff.role === 'OWNER') {
    await assertAnotherActiveOwnerExists(staffId);
  }

  const [updated] = await db
    .update(schema.adminUsers)
    .set({ is_active: false })
    .where(eq(schema.adminUsers.id, staffId))
    .returning();

  await auditService.log(
    {
      action: 'STAFF_DEACTIVATED',
      entityType: 'AdminUser',
      entityId: staffId,
      before: { isActive: true },
      after: { isActive: false, reason: input.reason ?? null },
    },
    context,
  );

  await db
    .update(schema.adminSessions)
    .set({ revoked_at: new Date() })
    .where(
      and(eq(schema.adminSessions.admin_user_id, staffId), isNull(schema.adminSessions.revoked_at)),
    );

  return toAdminStaffListItem(updated);
}

export async function resetStaffPassword(
  staffId: string,
  input: StaffPasswordResetInput,
  context: RequestContext,
): Promise<AdminStaffListItemDto> {
  assertValidUuid(staffId, 'staff');
  const db = getDbClient();
  const staff = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, staffId) });
  if (!staff) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Staff not found',
      status: 404,
    });
  }

  const [updated] = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(schema.adminUsers)
      .set({
        password_hash: null,
        password_set_at: null,
        updated_at: new Date(),
      })
      .where(eq(schema.adminUsers.id, staffId))
      .returning();

    await tx
      .update(schema.adminSessions)
      .set({ revoked_at: new Date() })
      .where(
        and(
          eq(schema.adminSessions.admin_user_id, staffId),
          isNull(schema.adminSessions.revoked_at),
        ),
      );

    return [row];
  });

  await auditService.log(
    {
      action: 'STAFF_PASSWORD_RESET',
      entityType: 'AdminUser',
      entityId: staffId,
      before: { passwordStatus: staff.password_hash ? 'SET' : 'NOT_SET' },
      after: { passwordStatus: 'NOT_SET', reason: input.reason ?? null },
    },
    context,
  );

  return toAdminStaffListItem(updated);
}

export async function updateStaffPermissions(
  staffId: string,
  input: { granted: string[]; denied: string[] },
  context: RequestContext,
): Promise<AdminStaffListItemDto> {
  const db = getDbClient();

  const staff = await db.query.adminUsers.findFirst({
    where: eq(schema.adminUsers.id, staffId),
  });

  if (!staff) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Staff member not found',
      status: 404,
    });
  }

  const overrides = input.granted.length === 0 && input.denied.length === 0 ? null : input;

  const [updated] = await db
    .update(schema.adminUsers)
    .set({ permission_overrides: overrides, updated_at: new Date() })
    .where(eq(schema.adminUsers.id, staffId))
    .returning();

  await auditService.log(
    {
      action: 'STAFF_PERMISSIONS_UPDATED',
      entityType: 'AdminUser',
      entityId: staffId,
      before: { permissionOverrides: staff.permission_overrides ?? null },
      after: { permissionOverrides: overrides },
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
    displayName: user.display_name,
    status: user.status as UserStatus,
    membershipTier: user.membership_tier as MemberTier,
    createdAt: user.created_at.toISOString(),
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
    displayName: user.display_name,
    status: user.status as UserStatus,
    membershipTier: user.membership_tier as MemberTier,
    createdAt: user.created_at.toISOString(),
    localePreference: user.locale_preference as Locale | null,
    onboardingComplete: !!(user.display_name && user.locale_preference && user.terms_accepted_at),
    termsAcceptedAt: user.terms_accepted_at?.toISOString() ?? null,
    updatedAt: user.updated_at.toISOString(),
    country: user.country ?? null,
    city: user.city ?? null,
    about: user.about ?? null,
    avatarUrl: user.avatar_url ?? null,
    cards: (cards ?? []).map(toMemberCardDto),
    subscriptions: (subscriptions ?? []).map(toSubscriptionDto),
    auditEntries: (auditEntries ?? []).map((log: any) => ({
      id: log.id,
      actorStaffId: log.actor_staff_id ?? null,
      actorRole: log.actor_role as any,
      action: log.action as any,
      entityType: log.entity_type,
      entityId: log.entity_id,
      before: log.before_data as Record<string, unknown> | null,
      after: log.after_data as Record<string, unknown> | null,
      ipAddress: log.ip_address ?? null,
      createdAt: log.created_at?.toISOString() ?? new Date().toISOString(),
    })),
  };
}

function toAdminCardListItem(card: any): AdminCardListItemDto {
  return {
    id: card.id,
    userId: card.user_id,
    userPhone: card.user?.phone ?? '',
    userDisplayName: card.user?.display_name ?? null,
    cardNumber: card.card_number,
    status: card.status as ClubCardStatus,
    membershipTier: card.membership_tier as MemberTier,
    issuedAt: card.issued_at.toISOString(),
    expiresAt: card.expires_at?.toISOString() ?? null,
  };
}

function toAdminBusinessOwnerSummary(user: any): AdminBusinessOwnerSummaryDto {
  return {
    id: user.id,
    phone: user.phone,
    displayName: user.display_name,
    status: user.status as UserStatus,
    membershipTier: user.membership_tier as MemberTier,
  };
}

function toAdminBusinessSubscriptionIndicator(
  sub: any,
): AdminBusinessSubscriptionIndicatorDto | null {
  if (!sub) return null;
  return {
    status: sub.status as SubscriptionStatus,
    currentPeriodEnd: sub.current_period_end?.toISOString() ?? null,
  };
}

function getCategoryPath(category: any): {
  blockName: string | null;
  blockSlug: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  subcategoryName: string | null;
  subcategorySlug: string | null;
} {
  if (!category) {
    return {
      blockName: null,
      blockSlug: null,
      categoryName: null,
      categorySlug: null,
      subcategoryName: null,
      subcategorySlug: null,
    };
  }

  if (category.level === 'SUBCATEGORY') {
    const parent = category.parent;
    const block = parent?.parent;
    return {
      blockName: block?.name ?? null,
      blockSlug: block?.slug ?? null,
      categoryName: parent?.name ?? category.name,
      categorySlug: parent?.slug ?? category.slug,
      subcategoryName: category.name,
      subcategorySlug: category.slug,
    };
  }

  if (category.level === 'CATEGORY') {
    const block = category.parent;
    return {
      blockName: block?.name ?? null,
      blockSlug: block?.slug ?? null,
      categoryName: category.name,
      categorySlug: category.slug,
      subcategoryName: null,
      subcategorySlug: null,
    };
  }

  return {
    blockName: category.name,
    blockSlug: category.slug,
    categoryName: null,
    categorySlug: null,
    subcategoryName: null,
    subcategorySlug: null,
  };
}

function toAdminBusinessListItem(business: any): AdminBusinessListItemDto {
  const placementSub = business.subscriptions?.[0] ?? null;
  const categoryPath = getCategoryPath(business.category);
  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    categoryId: business.category_id,
    blockName: categoryPath.blockName,
    blockSlug: categoryPath.blockSlug,
    categoryName: categoryPath.categoryName ?? business.category?.name ?? '',
    categorySlug: categoryPath.categorySlug,
    subcategoryName: categoryPath.subcategoryName,
    subcategorySlug: categoryPath.subcategorySlug,
    countryName: business.country?.name ?? '',
    cityName: business.city?.name ?? '',
    briefDescription: business.brief_description,
    websiteUrl: business.website_url,
    socialUrl: business.social_url,
    featuredTop: business.featured_top,
    featuredRecommended: business.featured_recommended,
    coverImageUrl: business.cover_image_url ?? null,
    logoUrl: business.logo_url ?? null,
    memberDiscountPercent: business.member_discount_percent ?? null,
    discountMuted: business.discount_muted ?? false,
    description: business.description,
    representativeName: business.representative_name,
    publishedAt: business.published_at?.toISOString() ?? null,
    ownerUserId: business.user_id,
    status: business.status as BusinessStatus,
    representativeEmail: business.representative_email,
    representativePhone: business.representative_phone,
    rejectionReason: business.rejection_reason,
    internalNotes: business.internal_notes,
    approvedAt: business.approved_at?.toISOString() ?? null,
    hiddenAt: business.hidden_at?.toISOString() ?? null,
    createdAt: business.created_at.toISOString(),
    updatedAt: business.updated_at.toISOString(),
    owner: toAdminBusinessOwnerSummary(business.user),
    placementSubscription: toAdminBusinessSubscriptionIndicator(placementSub),
  };
}

function toAdminBusinessDetail(business: any, auditEntries?: any[]): AdminBusinessDetailDto {
  return {
    ...toAdminBusinessListItem(business),
    auditEntries: (auditEntries ?? []).map((log: any) => ({
      id: log.id,
      actorStaffId: log.actor_staff_id ?? null,
      actorRole: log.actor_role as any,
      action: log.action as any,
      entityType: log.entity_type,
      entityId: log.entity_id,
      before: log.before_data as Record<string, unknown> | null,
      after: log.after_data as Record<string, unknown> | null,
      ipAddress: log.ip_address ?? null,
      createdAt: log.created_at?.toISOString() ?? new Date().toISOString(),
    })),
  };
}

function toIntroductionDto(intro: any): IntroductionDto {
  return {
    id: intro.id,
    requesterUserId: intro.requester_user_id,
    requesterBusinessId: intro.requester_business_id ?? null,
    targetBusinessId: intro.target_business_id,
    status: intro.status as IntroductionStatus,
    clientName: intro.client_name ?? '',
    clientContact: intro.client_contact ?? '',
    message: intro.message,
    rejectionReason: intro.rejection_reason,
    createdAt: intro.created_at.toISOString(),
    updatedAt: intro.updated_at.toISOString(),
  };
}

function toAdminIntroductionListItem(intro: any): AdminIntroductionListItemDto {
  return {
    id: intro.id,
    requesterUserId: intro.requester_user_id,
    requesterBusinessId: intro.requester_business_id,
    targetBusinessId: intro.target_business_id,
    status: intro.status as IntroductionStatus,
    clientName: intro.client_name ?? '',
    clientContact: intro.client_contact ?? '',
    message: intro.message,
    rejectionReason: intro.rejection_reason,
    createdAt: intro.created_at.toISOString(),
    updatedAt: intro.updated_at.toISOString(),
    requesterUser: {
      id: intro.requesterUser?.id ?? '',
      phone: intro.requesterUser?.phone ?? '',
      displayName: intro.requesterUser?.display_name ?? null,
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
    userId: sub.user_id,
    status: sub.status as SubscriptionStatus,
    stripeCustomerId: sub.stripe_customer_id,
    stripeSubscriptionId: sub.stripe_subscription_id,
    currentPeriodStart: sub.current_period_start?.toISOString() ?? null,
    currentPeriodEnd: sub.current_period_end?.toISOString() ?? null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    createdAt: sub.created_at.toISOString(),
    updatedAt: sub.updated_at.toISOString(),
  };
}

function toAdminSubscriptionListItem(sub: any): AdminSubscriptionListItemDto {
  return {
    id: sub.id,
    userId: sub.user_id ?? null,
    kind: sub.kind as SubscriptionKind,
    status: sub.status as SubscriptionStatus,
    stripeCustomerId: sub.stripe_customer_id,
    stripeSubscriptionId: sub.stripe_subscription_id,
    stripePriceId: sub.stripe_price_id,
    currentPeriodStart: sub.current_period_start?.toISOString() ?? null,
    currentPeriodEnd: sub.current_period_end?.toISOString() ?? null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    createdAt: sub.created_at.toISOString(),
    updatedAt: sub.updated_at.toISOString(),
    user: sub.user
      ? {
          id: sub.user.id,
          phone: sub.user.phone,
          displayName: sub.user.display_name,
          membershipTier: sub.user.membership_tier as MemberTier,
        }
      : null,
    businessName: sub.business_profile?.name ?? null,
  };
}

function toCategoryDto(cat: any): CategoryDto {
  return {
    id: cat.id,
    parentId: cat.parent_id ?? null,
    level: cat.level as CategoryDto['level'],
    name: cat.name,
    slug: cat.slug,
    isHighRisk: cat.is_high_risk,
    isActive: cat.is_active,
    isCustom: cat.is_custom,
    sortOrder: cat.sort_order ?? 0,
    createdAt: cat.created_at.toISOString(),
    updatedAt: cat.updated_at.toISOString(),
  };
}

function toCountryDto(country: any): CountryDto {
  return {
    id: country.id,
    code2: country.code2,
    code3: country.code3 ?? null,
    name: country.name,
    slug: country.slug,
    isActive: country.is_active,
    createdAt: country.created_at.toISOString(),
    updatedAt: country.updated_at.toISOString(),
  };
}

function toCityDto(city: any): CityDto {
  return {
    id: city.id,
    countryId: city.country_id,
    countryName: city.country?.name ?? '',
    name: city.name,
    slug: city.slug,
    isActive: city.is_active,
    createdAt: city.created_at.toISOString(),
    updatedAt: city.updated_at.toISOString(),
  };
}

function toAdminStaffListItem(staff: any): AdminStaffListItemDto {
  return {
    id: staff.id,
    phone: staff.phone,
    displayName: staff.display_name,
    role: staff.role,
    isActive: staff.is_active,
    passwordStatus: staff.password_hash ? 'SET' : 'NOT_SET',
    permissionOverrides: staff.permission_overrides ?? null,
    createdAt: staff.created_at.toISOString(),
    updatedAt: staff.updated_at.toISOString(),
  };
}

function toAdminConfigEntry(config: any): AdminConfigEntryDto {
  return {
    id: config.id,
    key: config.key,
    value: config.value,
    description: config.description,
    updatedAt: config.updated_at.toISOString(),
  };
}
