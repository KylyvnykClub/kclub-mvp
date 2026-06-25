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
import { getPrismaClient } from '@/server/db';
import { createDbAuditService } from '@/server/audit';
import type { RequestContext } from '@/server/context';
import { revokeCard, reissueCard, toMemberCardDto } from './card-service';

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
  const prisma = getPrismaClient();

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
    prisma.user.count(),
    prisma.user.count({ where: { status: 'BLOCKED' } }),
    prisma.vipSubscription.count({ where: { status: 'ACTIVE' } }),
    prisma.vipSubscription.count({ where: { status: 'PAST_DUE' } }),
    prisma.vipSubscription.count({ where: { status: 'EXPIRED' } }),
    prisma.businessProfile.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.businessIntroduction.count({ where: { status: 'SUBMITTED' } }),
    prisma.businessIntroduction.count({ where: { status: 'IN_REVIEW' } }),
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
  const prisma = getPrismaClient();

  const where: Record<string, unknown> = {};

  if (params.search) {
    where.OR = [
      { phone: { contains: params.search } },
      { display_name: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.membershipTier) {
    where.membership_tier = params.membershipTier;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { data: users.map(toAdminUserListItem), total };
}

export async function getUserDetail(userId: string): Promise<AdminUserDetailDto> {
  const prisma = getPrismaClient();

  const [user, cards, subscriptions, auditEntries] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.memberCard.findMany({
      where: { user_id: userId },
      orderBy: { issued_at: 'desc' },
    }),
    prisma.vipSubscription.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    }),
    prisma.auditLog.findMany({
      where: { entity_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
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

export async function blockUser(
  userId: string,
  input: BlockUserInput,
  context: RequestContext,
): Promise<AdminUserDetailDto> {
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({ where: { id: userId } });
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

  const [updated] = await prisma.$transaction(async (tx) => {
    await tx.memberCard.updateMany({
      where: { user_id: userId, status: 'ACTIVE' },
      data: {
        status: 'REVOKED',
        revoked_at: new Date(),
        revoked_reason: input.reason ?? 'User blocked',
      },
    });

    const u = await tx.user.update({
      where: { id: userId },
      data: { status: 'BLOCKED' },
    });

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

  return toAdminUserDetail(updated);
}

export async function unblockUser(
  userId: string,
  input: UnblockUserInput,
  context: RequestContext,
): Promise<AdminUserDetailDto> {
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({ where: { id: userId } });
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

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: 'ACTIVE' },
  });

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

  return toAdminUserDetail(updated);
}

// ── Cards ──

export async function listCards(
  params: AdminCardListInput,
): Promise<{ data: AdminCardListItemDto[]; total: number }> {
  const prisma = getPrismaClient();

  const where: Record<string, unknown> = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.membershipTier) {
    where.membership_tier = params.membershipTier;
  }

  if (params.search) {
    where.user = {
      OR: [
        { phone: { contains: params.search } },
        { display_name: { contains: params.search, mode: 'insensitive' } },
      ],
    };
  }

  const [cards, total] = await Promise.all([
    prisma.memberCard.findMany({
      where,
      include: { user: { select: { phone: true, display_name: true } } },
      orderBy: { issued_at: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.memberCard.count({ where }),
  ]);

  return { data: cards.map(toAdminCardListItem), total };
}

export async function getCardDetail(cardId: string): Promise<MemberCardDto> {
  const prisma = getPrismaClient();
  const card = await prisma.memberCard.findUnique({ where: { id: cardId } });
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
  const prisma = getPrismaClient();
  const card = await prisma.memberCard.findUnique({ where: { id: cardId } });
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
  const prisma = getPrismaClient();
  const card = await prisma.memberCard.findUnique({ where: { id: cardId } });
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
  category: true,
  country: true,
  city: true,
  user: {
    select: { id: true, phone: true, display_name: true, status: true, membership_tier: true },
  },
  subscriptions: {
    where: { kind: 'BUSINESS_PLACEMENT' as const },
    orderBy: { created_at: 'desc' as const },
    take: 1,
  },
};

export async function listBusinesses(
  params: AdminBusinessListInput,
): Promise<{ data: AdminBusinessListItemDto[]; total: number }> {
  const prisma = getPrismaClient();

  const where: Record<string, unknown> = {};
  if (params.status) {
    where.status = params.status;
  }

  const [businesses, total] = await Promise.all([
    prisma.businessProfile.findMany({
      where,
      include: BUSINESS_LIST_INCLUDE,
      orderBy: { created_at: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.businessProfile.count({ where }),
  ]);

  return { data: businesses.map(toAdminBusinessListItem), total };
}

const BUSINESS_MUTATION_INCLUDE = {
  category: true,
  country: true,
  city: true,
  user: {
    select: { id: true, phone: true, display_name: true, status: true, membership_tier: true },
  },
  subscriptions: {
    where: { kind: 'BUSINESS_PLACEMENT' as const },
    orderBy: { created_at: 'desc' as const },
    take: 1,
  },
};

const BUSINESS_DETAIL_INCLUDE = {
  category: true,
  country: true,
  city: true,
  user: {
    select: { id: true, phone: true, display_name: true, status: true, membership_tier: true },
  },
  subscriptions: {
    where: { kind: 'BUSINESS_PLACEMENT' as const },
    orderBy: { created_at: 'desc' as const },
    take: 1,
  },
};

export async function getBusinessDetail(businessId: string): Promise<AdminBusinessDetailDto> {
  const prisma = getPrismaClient();
  const business = await prisma.businessProfile.findUnique({
    where: { id: businessId },
    include: BUSINESS_DETAIL_INCLUDE,
  });
  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  const auditEntries = await prisma.auditLog.findMany({
    where: { entity_type: 'BusinessProfile', entity_id: businessId },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  return toAdminBusinessDetail(business, auditEntries);
}

export async function adminUpdateBusiness(
  businessId: string,
  input: AdminBusinessUpdateInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const prisma = getPrismaClient();

  const business = await prisma.businessProfile.findUnique({
    where: { id: businessId },
    include: BUSINESS_MUTATION_INCLUDE,
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  const updated = await prisma.businessProfile.update({
    where: { id: businessId },
    data: {
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
      ...(input.briefDescription !== undefined && {
        brief_description: input.briefDescription,
      }),
      updated_at: new Date(),
    },
    include: BUSINESS_MUTATION_INCLUDE,
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
      after: { name: updated.name, representativeEmail: updated.representative_email },
    },
    context,
  );

  return toAdminBusinessDetail(updated);
}

export async function approveBusiness(
  businessId: string,
  input: BusinessApproveInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const prisma = getPrismaClient();
  const business = await prisma.businessProfile.findUnique({
    where: { id: businessId },
    include: BUSINESS_MUTATION_INCLUDE,
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

  const updated = await prisma.businessProfile.update({
    where: { id: businessId },
    data: {
      status: 'APPROVED',
      approved_at: new Date(),
      internal_notes: input.notes ?? business.internal_notes,
    },
    include: BUSINESS_MUTATION_INCLUDE,
  });

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

  const auditEntries = await prisma.auditLog.findMany({
    where: { entity_type: 'BusinessProfile', entity_id: businessId },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  return toAdminBusinessDetail(updated, auditEntries);
}

export async function rejectBusiness(
  businessId: string,
  input: BusinessRejectInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const prisma = getPrismaClient();
  const business = await prisma.businessProfile.findUnique({
    where: { id: businessId },
    include: BUSINESS_MUTATION_INCLUDE,
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

  const updated = await prisma.businessProfile.update({
    where: { id: businessId },
    data: {
      status: 'REJECTED',
      rejection_reason: input.reason,
      rejected_at: new Date(),
    },
    include: BUSINESS_MUTATION_INCLUDE,
  });

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

  return toAdminBusinessDetail(updated);
}

export async function hideBusiness(
  businessId: string,
  input: BusinessHideInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const prisma = getPrismaClient();
  const business = await prisma.businessProfile.findUnique({
    where: { id: businessId },
    include: BUSINESS_MUTATION_INCLUDE,
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

  const updated = await prisma.businessProfile.update({
    where: { id: businessId },
    data: {
      status: 'HIDDEN',
      hidden_at: new Date(),
      featured_top: false,
      featured_recommended: false,
    },
    include: BUSINESS_MUTATION_INCLUDE,
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
      after: { status: updated.status, featuredTop: false, featuredRecommended: false },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return toAdminBusinessDetail(updated);
}

export async function updateBusinessFeatured(
  businessId: string,
  input: BusinessFeaturedInput,
  context: RequestContext,
): Promise<AdminBusinessDetailDto> {
  const prisma = getPrismaClient();

  const business = await prisma.businessProfile.findUnique({
    where: { id: businessId },
    include: BUSINESS_MUTATION_INCLUDE,
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

  const [updated] = await prisma.$transaction(async (tx) => {
    if (setTop !== undefined && setTop !== business.featured_top) {
      if (setTop) {
        const currentTopCount = await tx.businessProfile.count({
          where: { featured_top: true, id: { not: businessId } },
        });
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
        const currentRecommendedCount = await tx.businessProfile.count({
          where: { featured_recommended: true, id: { not: businessId } },
        });
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

    const b = await tx.businessProfile.update({
      where: { id: businessId },
      data: {
        featured_top: setTop !== undefined ? setTop : business.featured_top,
        featured_recommended:
          setRecommended !== undefined ? setRecommended : business.featured_recommended,
      },
      include: {
        category: true,
        country: true,
        city: true,
        user: {
          select: {
            id: true,
            phone: true,
            display_name: true,
            status: true,
            membership_tier: true,
          },
        },
        subscriptions: {
          where: { kind: 'BUSINESS_PLACEMENT' as const },
          orderBy: { created_at: 'desc' as const },
          take: 1,
        },
      },
    });

    return [b];
  });

  await auditService.log(
    {
      action: 'BUSINESS_FEATURED_UPDATED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: {
        featuredTop: business.featured_top,
        featuredRecommended: business.featured_recommended,
      },
      after: {
        featuredTop: updated.featured_top,
        featuredRecommended: updated.featured_recommended,
      },
    },
    context,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  return toAdminBusinessDetail(updated);
}

// ── Introductions ──

const INTRODUCTION_LIST_INCLUDE = {
  requester_user: { select: { id: true, phone: true, display_name: true } },
  requester_business: { select: { id: true, name: true, slug: true } },
  target_business: { select: { id: true, name: true, slug: true } },
} as const;

export async function listIntroductions(): Promise<AdminIntroductionListItemDto[]> {
  const prisma = getPrismaClient();
  const introductions = await prisma.businessIntroduction.findMany({
    include: INTRODUCTION_LIST_INCLUDE,
    orderBy: { created_at: 'desc' },
  });
  return introductions.map(toAdminIntroductionListItem);
}

export async function getIntroductionDetail(
  introductionId: string,
): Promise<AdminIntroductionListItemDto> {
  const prisma = getPrismaClient();
  const intro = await prisma.businessIntroduction.findUnique({
    where: { id: introductionId },
    include: INTRODUCTION_LIST_INCLUDE,
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
  const prisma = getPrismaClient();
  const intro = await prisma.businessIntroduction.findUnique({ where: { id: introductionId } });
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

  const updated = await prisma.businessIntroduction.update({
    where: { id: introductionId },
    data: { status: 'APPROVED' },
  });

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
  const prisma = getPrismaClient();
  const intro = await prisma.businessIntroduction.findUnique({ where: { id: introductionId } });
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

  const updated = await prisma.businessIntroduction.update({
    where: { id: introductionId },
    data: { status: 'REJECTED', rejection_reason: input.reason },
  });

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
  const prisma = getPrismaClient();
  const intro = await prisma.businessIntroduction.findUnique({ where: { id: introductionId } });
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

  const updated = await prisma.businessIntroduction.update({
    where: { id: introductionId },
    data: { status: 'COMPLETED' },
  });

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
  const prisma = getPrismaClient();
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return categories.map(toCategoryDto);
}

export async function getCategory(categoryId: string): Promise<CategoryDto> {
  const prisma = getPrismaClient();
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
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
  const prisma = getPrismaClient();
  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug: input.slug,
      is_high_risk: input.isHighRisk ?? false,
      is_active: input.isActive ?? true,
    },
  });
  revalidateTag('categories');
  return toCategoryDto(category);
}

export async function updateCategory(
  categoryId: string,
  input: CategoryUpdateInput,
): Promise<CategoryDto> {
  const prisma = getPrismaClient();
  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Category not found',
      status: 404,
    });
  }

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.isHighRisk !== undefined ? { is_high_risk: input.isHighRisk } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
    },
  });
  revalidateTag('categories');
  return toCategoryDto(category);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const prisma = getPrismaClient();
  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Category not found',
      status: 404,
    });
  }
  await prisma.category.delete({ where: { id: categoryId } });
  revalidateTag('categories');
}

export async function listCountries(): Promise<CountryDto[]> {
  const prisma = getPrismaClient();
  const countries = await prisma.country.findMany({ orderBy: { name: 'asc' } });
  return countries.map(toCountryDto);
}

export async function getCountry(countryId: string): Promise<CountryDto> {
  const prisma = getPrismaClient();
  const country = await prisma.country.findUnique({ where: { id: countryId } });
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
  const prisma = getPrismaClient();
  const country = await prisma.country.create({
    data: {
      code2: input.code2,
      code3: input.code3 ?? null,
      name: input.name,
      slug: input.slug,
      is_active: input.isActive ?? true,
    },
  });
  return toCountryDto(country);
}

export async function updateCountry(
  countryId: string,
  input: CountryUpdateInput,
): Promise<CountryDto> {
  const prisma = getPrismaClient();
  const existing = await prisma.country.findUnique({ where: { id: countryId } });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Country not found',
      status: 404,
    });
  }

  const country = await prisma.country.update({
    where: { id: countryId },
    data: {
      ...(input.code2 !== undefined ? { code2: input.code2 } : {}),
      ...(input.code3 !== undefined ? { code3: input.code3 } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
    },
  });
  return toCountryDto(country);
}

export async function deleteCountry(countryId: string): Promise<void> {
  const prisma = getPrismaClient();
  const existing = await prisma.country.findUnique({ where: { id: countryId } });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Country not found',
      status: 404,
    });
  }
  await prisma.country.delete({ where: { id: countryId } });
}

export async function listCities(): Promise<CityDto[]> {
  const prisma = getPrismaClient();
  const cities = await prisma.city.findMany({
    include: { country: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  });
  return cities.map(toCityDto);
}

export async function getCity(cityId: string): Promise<CityDto> {
  const prisma = getPrismaClient();
  const city = await prisma.city.findUnique({
    where: { id: cityId },
    include: { country: { select: { id: true, name: true } } },
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
  const prisma = getPrismaClient();
  const country = await prisma.country.findUnique({ where: { id: input.countryId } });
  if (!country) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Country not found',
      status: 404,
    });
  }

  const city = await prisma.city.create({
    data: {
      country_id: input.countryId,
      name: input.name,
      slug: input.slug,
      is_active: input.isActive ?? true,
    },
    include: { country: { select: { id: true, name: true } } },
  });
  return toCityDto(city);
}

export async function updateCity(cityId: string, input: CityUpdateInput): Promise<CityDto> {
  const prisma = getPrismaClient();
  const existing = await prisma.city.findUnique({ where: { id: cityId } });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'City not found',
      status: 404,
    });
  }

  if (input.countryId !== undefined) {
    const country = await prisma.country.findUnique({ where: { id: input.countryId } });
    if (!country) {
      throw new AppError({
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Country not found',
        status: 404,
      });
    }
  }

  const city = await prisma.city.update({
    where: { id: cityId },
    data: {
      ...(input.countryId !== undefined ? { country_id: input.countryId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
    },
    include: { country: { select: { id: true, name: true } } },
  });
  return toCityDto(city);
}

export async function deleteCity(cityId: string): Promise<void> {
  const prisma = getPrismaClient();
  const existing = await prisma.city.findUnique({ where: { id: cityId } });
  if (!existing) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'City not found',
      status: 404,
    });
  }
  await prisma.city.delete({ where: { id: cityId } });
}

// ── Subscriptions (Admin Read) ──

export async function listSubscriptions(): Promise<SubscriptionDto[]> {
  const prisma = getPrismaClient();
  const subs = await prisma.vipSubscription.findMany({
    orderBy: { created_at: 'desc' },
  });
  return subs.map(toSubscriptionDto);
}

const ADMIN_SUBSCRIPTION_INCLUDE = {
  user: { select: { id: true, phone: true, display_name: true, membership_tier: true } },
  business_profile: { select: { name: true } },
} as const;

export async function listAdminSubscriptions(): Promise<AdminSubscriptionListItemDto[]> {
  const prisma = getPrismaClient();
  const subs = await prisma.subscription.findMany({
    include: ADMIN_SUBSCRIPTION_INCLUDE,
    orderBy: { created_at: 'desc' },
  });
  return subs.map(toAdminSubscriptionListItem);
}

export async function getAdminSubscriptionDetail(
  subscriptionId: string,
): Promise<AdminSubscriptionListItemDto> {
  const prisma = getPrismaClient();
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: ADMIN_SUBSCRIPTION_INCLUDE,
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
  const prisma = getPrismaClient();
  const sub = await prisma.vipSubscription.findUnique({ where: { id: subscriptionId } });
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
  const prisma = getPrismaClient();
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: ADMIN_SUBSCRIPTION_INCLUDE,
  });
  if (!sub) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Subscription not found',
      status: 404,
    });
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { cancel_at_period_end: true, canceled_at: new Date() },
    include: ADMIN_SUBSCRIPTION_INCLUDE,
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

  return toAdminSubscriptionListItem(updated);
}

// ── Audit Log ──

export async function listAuditLogs(
  filters: Partial<AuditLogListInput> = {},
): Promise<{ data: AuditLogDto[]; total: number }> {
  const prisma = getPrismaClient();
  const where: Record<string, unknown> = {};

  if (filters.action) where.action = filters.action;
  if (filters.actorRole) where.actor_role = filters.actorRole;
  if (filters.entityType) where.entity_type = { contains: filters.entityType };
  if (filters.dateFrom || filters.dateTo) {
    const createdAtFilter: Record<string, Date> = {};
    if (filters.dateFrom) createdAtFilter.gte = filters.dateFrom;
    if (filters.dateTo) createdAtFilter.lte = filters.dateTo;
    where.created_at = createdAtFilter;
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
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

export async function getStripePrices(): Promise<StripePricesMap> {
  const prisma = getPrismaClient();
  const configs = await prisma.adminConfig.findMany({
    where: { key: { in: STRIPE_PRICE_KEYS as unknown as string[] } },
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
  const prisma = getPrismaClient();

  for (const [key, priceId] of Object.entries(input)) {
    if (!STRIPE_PRICE_KEYS.includes(key as StripePriceKey)) continue;

    await prisma.adminConfig.upsert({
      where: { key },
      create: {
        key,
        value: { priceId },
        description: `Stripe Price ID for ${key.replace('stripe_price_', '')}`,
      },
      update: {
        value: { priceId },
      },
    });
  }

  return getStripePrices();
}

export async function getAdminConfig(key: string): Promise<AdminConfigEntryDto> {
  const prisma = getPrismaClient();
  const config = await prisma.adminConfig.findUnique({ where: { key } });
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
  const prisma = getPrismaClient();
  const existing = await prisma.adminConfig.findUnique({ where: { key } });

  let result;
  if (existing) {
    result = await prisma.adminConfig.update({
      where: { key },
      data: {
        value: input.value,
        description: input.description ?? existing.description,
      },
    });
  } else {
    result = await prisma.adminConfig.create({
      data: {
        key,
        value: input.value,
        description: input.description ?? null,
      },
    });
  }
  return toAdminConfigEntry(result);
}

export async function getMembershipPlans(): Promise<MembershipPlanDto[]> {
  const prisma = getPrismaClient();
  const configs = await prisma.adminConfig.findMany({
    where: {
      key: { in: ['vip_membership_monthly', 'business_placement_monthly'] },
    },
  });
  return configs.map((c: any) => ({
    key: c.key,
    value: c.value,
    description: c.description,
  }));
}

export async function listStaff(context: RequestContext): Promise<AdminStaffListItemDto[]> {
  const prisma = getPrismaClient();
  const staff = await prisma.adminUser.findMany({
    orderBy: { created_at: 'asc' },
  });
  return staff.map(toAdminStaffListItem);
}

export async function getStaffDetail(staffId: string): Promise<AdminStaffListItemDto> {
  assertValidUuid(staffId, 'staff');
  const prisma = getPrismaClient();
  const staff = await prisma.adminUser.findUnique({ where: { id: staffId } });
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
  const prisma = getPrismaClient();
  const staff = await prisma.adminUser.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Staff not found',
      status: 404,
    });
  }

  const updated = await prisma.adminUser.update({
    where: { id: staffId },
    data: { role: input.role as any },
  });

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
  const prisma = getPrismaClient();
  const staff = await prisma.adminUser.findUnique({ where: { id: staffId } });
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

  const updated = await prisma.adminUser.update({
    where: { id: staffId },
    data: { is_active: false },
  });

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

function toAdminBusinessListItem(business: any): AdminBusinessListItemDto {
  const placementSub = business.subscriptions?.[0] ?? null;
  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    categoryName: business.category?.name ?? '',
    countryName: business.country?.name ?? '',
    cityName: business.city?.name ?? '',
    briefDescription: business.brief_description,
    websiteUrl: business.website_url,
    socialUrl: business.social_url,
    featuredTop: business.featured_top,
    featuredRecommended: business.featured_recommended,
    memberDiscountPercent: business.member_discount_percent ?? null,
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
    message: intro.message,
    rejectionReason: intro.rejection_reason,
    createdAt: intro.created_at.toISOString(),
    updatedAt: intro.updated_at.toISOString(),
    requesterUser: {
      id: intro.requester_user?.id ?? '',
      phone: intro.requester_user?.phone ?? '',
      displayName: intro.requester_user?.display_name ?? null,
    },
    requesterBusiness: {
      id: intro.requester_business?.id ?? '',
      name: intro.requester_business?.name ?? '',
      slug: intro.requester_business?.slug ?? '',
    },
    targetBusiness: {
      id: intro.target_business?.id ?? '',
      name: intro.target_business?.name ?? '',
      slug: intro.target_business?.slug ?? '',
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
    name: cat.name,
    slug: cat.slug,
    isHighRisk: cat.is_high_risk,
    isActive: cat.is_active,
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
    totpVerified: !!staff.totp_verified_at,
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
