import {
  ERROR_CODES,
  type BusinessIncomingIntroductionDto,
  type MemberIntroductionDto,
} from '@kclub/contracts';
import {
  canCreateIntroductionForDay,
  canCreateIntroductionForTarget,
  canCreatePendingIntroduction,
  hasActiveVipAccess,
} from '@kclub/domain';
import type { IntroductionRejectInput, IntroductionSubmitInput } from '@kclub/validation';

import { eq, and, not, gte, inArray, notInArray, desc, count } from 'drizzle-orm';
import { AppError } from '@/server/errors';
import { getDbClient, schema } from '@/server/db';
import { createDbAuditService } from '@/server/audit';
import type { RequestContext } from '@/server/context';

const auditService = createDbAuditService();

type IntroductionTargetBusiness = { name: string; slug: string };
type IntroductionRequesterBusiness = { slug: string };
type IntroductionRequesterUser = { display_name: string | null };
type IntroductionRecord = typeof schema.businessIntroductions.$inferSelect & {
  targetBusiness?: IntroductionTargetBusiness | null;
  target_business?: IntroductionTargetBusiness | null;
  requesterUser?: IntroductionRequesterUser | null;
  requester_user?: IntroductionRequesterUser | null;
  requesterBusiness?: IntroductionRequesterBusiness | null;
  requester_business?: IntroductionRequesterBusiness | null;
};

async function assertCanRecommend(userId: string): Promise<void> {
  const db = getDbClient();

  const [vipSubs, ownBusiness] = await Promise.all([
    db.query.vipSubscriptions.findMany({ where: eq(schema.vipSubscriptions.user_id, userId) }),
    db.query.businessProfiles.findFirst({
      where: and(
        eq(schema.businessProfiles.user_id, userId),
        not(eq(schema.businessProfiles.status, 'REJECTED')),
      ),
    }),
  ]);

  const isVip = vipSubs.some((sub) => hasActiveVipAccess(sub.status));
  const hasBusiness = ownBusiness !== null;

  if (!isVip && !hasBusiness) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'VIP membership or an approved business is required to send recommendations',
      status: 403,
    });
  }
}

export async function submitIntroduction(
  input: IntroductionSubmitInput,
  context: RequestContext,
): Promise<MemberIntroductionDto> {
  const db = getDbClient();
  const userId = context.actor?.kind === 'member' ? context.actor.userId : null;

  if (!userId) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'Authentication required',
      status: 401,
    });
  }

  await assertCanRecommend(userId);

  const targetBusiness = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, input.targetBusinessId),
  });

  if (!targetBusiness || targetBusiness.status !== 'PUBLISHED') {
    throw new AppError({
      code: ERROR_CODES.INTRODUCTION_TARGET_UNAVAILABLE,
      message: 'Target business not found or not published',
      status: 404,
    });
  }

  if (targetBusiness.user_id === userId) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_INVALID_INPUT,
      message: 'Cannot recommend to your own business',
      status: 400,
    });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const introductionsTodayResult = await db
    .select({ count: count() })
    .from(schema.businessIntroductions)
    .where(
      and(
        eq(schema.businessIntroductions.requester_user_id, userId),
        gte(schema.businessIntroductions.created_at, todayStart),
      ),
    );
  const introductionsToday = introductionsTodayResult[0]!.count;

  if (!canCreateIntroductionForDay(introductionsToday)) {
    throw new AppError({
      code: ERROR_CODES.RATE_LIMIT_INTRODUCTION_DAILY,
      message: 'Daily recommendation limit reached',
      status: 429,
    });
  }

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const targetIntroResult = await db
    .select({ count: count() })
    .from(schema.businessIntroductions)
    .where(
      and(
        eq(schema.businessIntroductions.requester_user_id, userId),
        eq(schema.businessIntroductions.target_business_id, input.targetBusinessId),
        gte(schema.businessIntroductions.created_at, thirtyDaysAgo),
      ),
    );
  const targetIntroductionsIn30Days = targetIntroResult[0]!.count;

  if (!canCreateIntroductionForTarget(targetIntroductionsIn30Days)) {
    throw new AppError({
      code: ERROR_CODES.RATE_LIMIT_INTRODUCTION_TARGET,
      message: 'Too many recommendations to this target recently',
      status: 429,
    });
  }

  const pendingCountResult = await db
    .select({ count: count() })
    .from(schema.businessIntroductions)
    .where(
      and(
        eq(schema.businessIntroductions.requester_user_id, userId),
        eq(schema.businessIntroductions.target_business_id, input.targetBusinessId),
        inArray(schema.businessIntroductions.status, ['SUBMITTED', 'IN_REVIEW']),
      ),
    );
  const pendingCount = pendingCountResult[0]!.count;

  if (!canCreatePendingIntroduction(pendingCount)) {
    throw new AppError({
      code: ERROR_CODES.INTRODUCTION_PENDING_EXISTS,
      message: 'You already have a pending recommendation to this target',
      status: 409,
    });
  }

  const [introductionRaw] = await db
    .insert(schema.businessIntroductions)
    .values({
      requester_user_id: userId,
      requester_business_id: null,
      target_business_id: input.targetBusinessId,
      status: 'SUBMITTED',
      client_name: input.clientName,
      client_contact: input.clientContact,
      message: input.message ?? null,
    })
    .returning();

  const introduction = (await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionRaw!.id),
    with: { targetBusiness: { columns: { name: true, slug: true } } },
  })) as IntroductionRecord | null;

  await auditService.log(
    {
      action: 'INTRODUCTION_SUBMITTED',
      entityType: 'BusinessIntroduction',
      entityId: introduction!.id,
      after: { status: introduction!.status },
    },
    context,
  );

  return toMemberIntroductionDto(introduction!);
}

export async function getOwnIntroductions(userId: string): Promise<MemberIntroductionDto[]> {
  const db = getDbClient();
  const introductions = await db.query.businessIntroductions.findMany({
    where: eq(schema.businessIntroductions.requester_user_id, userId),
    with: { targetBusiness: { columns: { name: true, slug: true } } },
    orderBy: [desc(schema.businessIntroductions.created_at)],
  });
  return introductions.map(toMemberIntroductionDto);
}

export async function cancelIntroduction(
  introductionId: string,
  context: RequestContext,
): Promise<MemberIntroductionDto> {
  const db = getDbClient();
  const userId = context.actor?.kind === 'member' ? context.actor.userId : null;

  if (!userId) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'Authentication required',
      status: 401,
    });
  }

  const introduction = await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
  });

  if (!introduction) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Recommendation not found',
      status: 404,
    });
  }

  if (introduction.requester_user_id !== userId) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'You do not have permission to cancel this recommendation',
      status: 403,
    });
  }

  if (['APPROVED', 'COMPLETED', 'REJECTED', 'CANCELED'].includes(introduction.status)) {
    throw new AppError({
      code: ERROR_CODES.INTRODUCTION_INVALID_STATUS_TRANSITION,
      message: 'Cannot cancel from current status',
      status: 409,
    });
  }

  await db
    .update(schema.businessIntroductions)
    .set({ status: 'CANCELED' })
    .where(eq(schema.businessIntroductions.id, introductionId));

  const updated = (await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
    with: { targetBusiness: { columns: { name: true, slug: true } } },
  })) as IntroductionRecord | null;

  await auditService.log(
    {
      action: 'INTRODUCTION_CANCELED',
      entityType: 'BusinessIntroduction',
      entityId: introductionId,
      before: { status: introduction.status },
      after: { status: updated!.status },
    },
    context,
  );

  return toMemberIntroductionDto(updated!);
}

export async function getIncomingIntroductions(
  businessId: string,
): Promise<BusinessIncomingIntroductionDto[]> {
  const db = getDbClient();
  // Businesses only see recommendations after admin moderation approved them.
  const introductions = await db.query.businessIntroductions.findMany({
    where: and(
      eq(schema.businessIntroductions.target_business_id, businessId),
      inArray(schema.businessIntroductions.status, ['APPROVED', 'COMPLETED']),
    ),
    with: {
      requesterUser: { columns: { display_name: true } },
      requesterBusiness: { columns: { slug: true } },
      targetBusiness: { columns: { name: true, slug: true } },
    },
    orderBy: [desc(schema.businessIntroductions.created_at)],
  });
  return introductions.map(toBusinessIncomingIntroductionDto);
}

export async function countPendingIncomingIntroductions(businessId: string): Promise<number> {
  const db = getDbClient();
  // APPROVED = admin approved, awaiting the business owner's response.
  return db.$count(
    schema.businessIntroductions,
    and(
      eq(schema.businessIntroductions.target_business_id, businessId),
      eq(schema.businessIntroductions.status, 'APPROVED'),
    ),
  );
}

export async function completeIntroduction(
  introductionId: string,
  context: RequestContext,
): Promise<BusinessIncomingIntroductionDto> {
  const db = getDbClient();
  const businessId = await resolveActorBusinessId(context);

  const introduction = await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
  });
  if (!introduction)
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Recommendation not found',
      status: 404,
    });
  if (introduction.target_business_id !== businessId)
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'Not your business recommendation',
      status: 403,
    });
  if (introduction.status !== 'APPROVED')
    throw new AppError({
      code: ERROR_CODES.INTRODUCTION_INVALID_STATUS_TRANSITION,
      message: 'Cannot complete from current status',
      status: 409,
    });

  await db
    .update(schema.businessIntroductions)
    .set({ status: 'COMPLETED' })
    .where(eq(schema.businessIntroductions.id, introductionId));

  const updated = (await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
    with: {
      requesterUser: { columns: { display_name: true } },
      requesterBusiness: { columns: { slug: true } },
      targetBusiness: { columns: { name: true, slug: true } },
    },
  })) as IntroductionRecord | null;

  await auditService.log(
    {
      action: 'INTRODUCTION_COMPLETED',
      entityType: 'BusinessIntroduction',
      entityId: introductionId,
      before: { status: introduction.status },
      after: { status: updated!.status },
    },
    context,
  );

  return toBusinessIncomingIntroductionDto(updated!);
}

export async function rejectIntroduction(
  introductionId: string,
  input: IntroductionRejectInput,
  context: RequestContext,
): Promise<BusinessIncomingIntroductionDto> {
  const db = getDbClient();
  const businessId = await resolveActorBusinessId(context);

  const introduction = await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
  });
  if (!introduction)
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Recommendation not found',
      status: 404,
    });
  if (introduction.target_business_id !== businessId)
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'Not your business recommendation',
      status: 403,
    });
  if (introduction.status !== 'APPROVED')
    throw new AppError({
      code: ERROR_CODES.INTRODUCTION_INVALID_STATUS_TRANSITION,
      message: 'Cannot reject from current status',
      status: 409,
    });

  await db
    .update(schema.businessIntroductions)
    .set({ status: 'REJECTED', rejection_reason: input.reason ?? null })
    .where(eq(schema.businessIntroductions.id, introductionId));

  const updated = (await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
    with: {
      requesterUser: { columns: { display_name: true } },
      requesterBusiness: { columns: { slug: true } },
      targetBusiness: { columns: { name: true, slug: true } },
    },
  })) as IntroductionRecord | null;

  await auditService.log(
    {
      action: 'INTRODUCTION_REJECTED',
      entityType: 'BusinessIntroduction',
      entityId: introductionId,
      before: { status: introduction.status },
      after: { status: updated!.status },
    },
    context,
  );

  return toBusinessIncomingIntroductionDto(updated!);
}

async function resolveActorBusinessId(context: RequestContext): Promise<string> {
  const userId = context.actor?.kind === 'member' ? context.actor.userId : null;
  if (!userId)
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'Authentication required',
      status: 401,
    });

  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: and(
      eq(schema.businessProfiles.user_id, userId),
      notInArray(schema.businessProfiles.status, ['REJECTED', 'HIDDEN']),
    ),
  });

  if (!business)
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'No active business found',
      status: 403,
    });

  return business.id;
}

export function toMemberIntroductionDto(intro: IntroductionRecord): MemberIntroductionDto {
  const tb = intro.targetBusiness || intro.target_business;
  return {
    id: intro.id,
    requesterUserId: intro.requester_user_id,
    requesterBusinessId: intro.requester_business_id ?? null,
    targetBusinessId: intro.target_business_id,
    status: intro.status,
    clientName: intro.client_name ?? '',
    clientContact: intro.client_contact ?? '',
    message: intro.message,
    rejectionReason: intro.rejection_reason,
    createdAt: intro.created_at.toISOString(),
    updatedAt: intro.updated_at.toISOString(),
    targetBusinessName: tb?.name ?? '',
    targetBusinessSlug: tb?.slug ?? '',
  };
}

export function toBusinessIncomingIntroductionDto(
  intro: IntroductionRecord,
): BusinessIncomingIntroductionDto {
  const ru = intro.requesterUser || intro.requester_user;
  const tb = intro.targetBusiness || intro.target_business;
  const rb = intro.requesterBusiness || intro.requester_business;
  return {
    id: intro.id,
    requesterUserId: intro.requester_user_id,
    requesterBusinessId: intro.requester_business_id ?? null,
    requesterDisplayName: ru?.display_name ?? null,
    requesterBusinessSlug: rb?.slug ?? null,
    targetBusinessId: intro.target_business_id,
    status: intro.status,
    clientName: intro.client_name ?? '',
    clientContact: intro.client_contact ?? '',
    message: intro.message,
    rejectionReason: intro.rejection_reason,
    createdAt: intro.created_at.toISOString(),
    updatedAt: intro.updated_at.toISOString(),
    targetBusinessName: tb?.name ?? '',
    targetBusinessSlug: tb?.slug ?? '',
  };
}
