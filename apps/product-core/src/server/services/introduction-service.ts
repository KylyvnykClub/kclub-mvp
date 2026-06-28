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

import { AppError } from '@/server/errors';
import { getDbClient, schema } from '@/server/db';
import { createDbAuditService } from '@/server/audit';
import { eq, and, not, count, gte, inArray } from 'drizzle-orm';
import type { RequestContext } from '@/server/context';

const auditService = createDbAuditService();

async function assertCanRecommend(userId: string): Promise<void> {
  const db = getDbClient();

  const [vipSubs, ownBusiness] = await Promise.all([
    db.query.vipSubscriptions.findMany({ where: eq(schema.vipSubscriptions.userId, userId) }),
    db.query.businessProfiles.findFirst({
      where: and(
        eq(schema.businessProfiles.userId, userId),
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
    throw new AppError({ code: ERROR_CODES.PERMISSION_DENIED, message: 'Authentication required', status: 401 });
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

  if (targetBusiness.userId === userId) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_INVALID_INPUT,
      message: 'Cannot recommend to your own business',
      status: 400,
    });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const [{ value: introductionsToday }] = await db
    .select({ value: count() })
    .from(schema.businessIntroductions)
    .where(and(
      eq(schema.businessIntroductions.requesterUserId, userId),
      gte(schema.businessIntroductions.createdAt, todayStart),
    ));

  if (!canCreateIntroductionForDay(introductionsToday)) {
    throw new AppError({ code: ERROR_CODES.RATE_LIMIT_INTRODUCTION_DAILY, message: 'Daily recommendation limit reached', status: 429 });
  }

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [{ value: targetIntroductionsIn30Days }] = await db
    .select({ value: count() })
    .from(schema.businessIntroductions)
    .where(and(
      eq(schema.businessIntroductions.requesterUserId, userId),
      eq(schema.businessIntroductions.targetBusinessId, input.targetBusinessId),
      gte(schema.businessIntroductions.createdAt, thirtyDaysAgo),
    ));

  if (!canCreateIntroductionForTarget(targetIntroductionsIn30Days)) {
    throw new AppError({ code: ERROR_CODES.RATE_LIMIT_INTRODUCTION_TARGET, message: 'Too many recommendations to this target recently', status: 429 });
  }

  const [{ value: pendingCount }] = await db
    .select({ value: count() })
    .from(schema.businessIntroductions)
    .where(and(
      eq(schema.businessIntroductions.requesterUserId, userId),
      eq(schema.businessIntroductions.targetBusinessId, input.targetBusinessId),
      inArray(schema.businessIntroductions.status, ['SUBMITTED', 'IN_REVIEW']),
    ));

  if (!canCreatePendingIntroduction(pendingCount)) {
    throw new AppError({ code: ERROR_CODES.INTRODUCTION_PENDING_EXISTS, message: 'You already have a pending recommendation to this target', status: 409 });
  }

  const [newIntro] = await db.insert(schema.businessIntroductions).values({
    requesterUserId: userId,
    targetBusinessId: input.targetBusinessId,
    status: 'SUBMITTED',
    clientName: input.clientName,
    clientContact: input.clientContact,
    message: input.message ?? null,
  }).returning();

  const introduction = await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, newIntro.id),
    with: {
      targetBusiness: { columns: { name: true, slug: true } },
    },
  });

  if (!introduction) throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Recommendation failed', status: 500 });

  await auditService.log(
    { action: 'INTRODUCTION_SUBMITTED', entityType: 'BusinessIntroduction', entityId: introduction.id, after: { status: introduction.status } },
    context,
  );

  return toMemberIntroductionDto(introduction);
}

export async function getOwnIntroductions(userId: string): Promise<MemberIntroductionDto[]> {
  const db = getDbClient();
  const introductions = await db.query.businessIntroductions.findMany({
    where: eq(schema.businessIntroductions.requesterUserId, userId),
    with: { targetBusiness: { columns: { name: true, slug: true } } },
    orderBy: (bi, { desc }) => [desc(bi.createdAt)],
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
    throw new AppError({ code: ERROR_CODES.PERMISSION_DENIED, message: 'Authentication required', status: 401 });
  }

  const introduction = await db.query.businessIntroductions.findFirst({ where: eq(schema.businessIntroductions.id, introductionId) });

  if (!introduction) {
    throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Recommendation not found', status: 404 });
  }

  if (introduction.requesterUserId !== userId) {
    throw new AppError({ code: ERROR_CODES.PERMISSION_DENIED, message: 'You do not have permission to cancel this recommendation', status: 403 });
  }

  if (['APPROVED', 'COMPLETED', 'REJECTED', 'CANCELED'].includes(introduction.status)) {
    throw new AppError({ code: ERROR_CODES.INTRODUCTION_INVALID_STATUS_TRANSITION, message: 'Cannot cancel from current status', status: 409 });
  }

  await db.update(schema.businessIntroductions).set({ status: 'CANCELED', updatedAt: new Date() }).where(eq(schema.businessIntroductions.id, introductionId));
  const updated = await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
    with: { targetBusiness: { columns: { name: true, slug: true } } },
  });
  
  if (!updated) throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Recommendation failed', status: 500 });

  await auditService.log(
    { action: 'INTRODUCTION_CANCELED', entityType: 'BusinessIntroduction', entityId: introductionId, before: { status: introduction.status }, after: { status: updated.status } },
    context,
  );

  return toMemberIntroductionDto(updated);
}

export async function getIncomingIntroductions(businessId: string): Promise<BusinessIncomingIntroductionDto[]> {
  const db = getDbClient();
  const introductions = await db.query.businessIntroductions.findMany({
    where: eq(schema.businessIntroductions.targetBusinessId, businessId),
    with: {
      requesterUser: { columns: { displayName: true } },
      targetBusiness: { columns: { name: true, slug: true } },
    },
    orderBy: (bi, { desc }) => [desc(bi.createdAt)],
  });
  return introductions.map(toBusinessIncomingIntroductionDto);
}

export async function reviewIntroduction(
  introductionId: string,
  context: RequestContext,
): Promise<BusinessIncomingIntroductionDto> {
  return updateIntroductionStatus(introductionId, 'IN_REVIEW', 'INTRODUCTION_APPROVED', context);
}

export async function approveIntroduction(
  introductionId: string,
  context: RequestContext,
): Promise<BusinessIncomingIntroductionDto> {
  return updateIntroductionStatus(introductionId, 'APPROVED', 'INTRODUCTION_APPROVED', context);
}

export async function rejectIntroduction(
  introductionId: string,
  input: IntroductionRejectInput,
  context: RequestContext,
): Promise<BusinessIncomingIntroductionDto> {
  const db = getDbClient();
  const businessId = await resolveActorBusinessId(context);

  const introduction = await db.query.businessIntroductions.findFirst({ where: eq(schema.businessIntroductions.id, introductionId) });
  if (!introduction) throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Recommendation not found', status: 404 });
  if (introduction.targetBusinessId !== businessId) throw new AppError({ code: ERROR_CODES.PERMISSION_DENIED, message: 'Not your business recommendation', status: 403 });
  if (!['SUBMITTED', 'IN_REVIEW'].includes(introduction.status)) throw new AppError({ code: ERROR_CODES.INTRODUCTION_INVALID_STATUS_TRANSITION, message: 'Cannot reject from current status', status: 409 });

  await db.update(schema.businessIntroductions).set({ status: 'REJECTED', rejectionReason: input.reason ?? null, updatedAt: new Date() }).where(eq(schema.businessIntroductions.id, introductionId));
  const updated = await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
    with: { requesterUser: { columns: { displayName: true } }, targetBusiness: { columns: { name: true, slug: true } } },
  });
  if (!updated) throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Recommendation failed', status: 500 });

  await auditService.log(
    { action: 'INTRODUCTION_REJECTED', entityType: 'BusinessIntroduction', entityId: introductionId, before: { status: introduction.status }, after: { status: updated.status } },
    context,
  );

  return toBusinessIncomingIntroductionDto(updated);
}

async function updateIntroductionStatus(
  introductionId: string,
  newStatus: 'IN_REVIEW' | 'APPROVED',
  auditAction: 'INTRODUCTION_APPROVED',
  context: RequestContext,
): Promise<BusinessIncomingIntroductionDto> {
  const db = getDbClient();
  const businessId = await resolveActorBusinessId(context);

  const introduction = await db.query.businessIntroductions.findFirst({ where: eq(schema.businessIntroductions.id, introductionId) });
  if (!introduction) throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Recommendation not found', status: 404 });
  if (introduction.targetBusinessId !== businessId) throw new AppError({ code: ERROR_CODES.PERMISSION_DENIED, message: 'Not your business recommendation', status: 403 });

  const validFrom: Record<string, string[]> = { IN_REVIEW: ['SUBMITTED'], APPROVED: ['IN_REVIEW'] };
  if (!validFrom[newStatus]?.includes(introduction.status)) {
    throw new AppError({ code: ERROR_CODES.INTRODUCTION_INVALID_STATUS_TRANSITION, message: 'Invalid status transition', status: 409 });
  }

  await db.update(schema.businessIntroductions).set({ status: newStatus, updatedAt: new Date() }).where(eq(schema.businessIntroductions.id, introductionId));
  const updated = await db.query.businessIntroductions.findFirst({
    where: eq(schema.businessIntroductions.id, introductionId),
    with: { requesterUser: { columns: { displayName: true } }, targetBusiness: { columns: { name: true, slug: true } } },
  });
  if (!updated) throw new AppError({ code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Recommendation failed', status: 500 });

  await auditService.log(
    { action: auditAction, entityType: 'BusinessIntroduction', entityId: introductionId, before: { status: introduction.status }, after: { status: updated.status } },
    context,
  );

  return toBusinessIncomingIntroductionDto(updated);
}

async function resolveActorBusinessId(context: RequestContext): Promise<string> {
  const userId = context.actor?.kind === 'member' ? context.actor.userId : null;
  if (!userId) throw new AppError({ code: ERROR_CODES.PERMISSION_DENIED, message: 'Authentication required', status: 401 });

  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: and(
      eq(schema.businessProfiles.userId, userId),
      not(inArray(schema.businessProfiles.status, ['REJECTED', 'HIDDEN'])),
    ),
  });

  if (!business) throw new AppError({ code: ERROR_CODES.PERMISSION_DENIED, message: 'No active business found', status: 403 });

  return business.id;
}

export function toMemberIntroductionDto(intro: any): MemberIntroductionDto {
  return {
    id: intro.id,
    requesterUserId: intro.requesterUserId,
    requesterBusinessId: intro.requesterBusinessId ?? null,
    targetBusinessId: intro.targetBusinessId,
    status: intro.status,
    clientName: intro.clientName ?? '',
    clientContact: intro.clientContact ?? '',
    message: intro.message,
    rejectionReason: intro.rejectionReason,
    createdAt: intro.createdAt.toISOString(),
    updatedAt: intro.updatedAt.toISOString(),
    targetBusinessName: intro.targetBusiness?.name ?? '',
    targetBusinessSlug: intro.targetBusiness?.slug ?? '',
  };
}

export function toBusinessIncomingIntroductionDto(intro: any): BusinessIncomingIntroductionDto {
  return {
    id: intro.id,
    requesterUserId: intro.requesterUserId,
    requesterBusinessId: intro.requesterBusinessId ?? null,
    requesterDisplayName: intro.requesterUser?.displayName ?? null,
    targetBusinessId: intro.targetBusinessId,
    status: intro.status,
    clientName: intro.clientName ?? '',
    clientContact: intro.clientContact ?? '',
    message: intro.message,
    rejectionReason: intro.rejectionReason,
    createdAt: intro.createdAt.toISOString(),
    updatedAt: intro.updatedAt.toISOString(),
    targetBusinessName: intro.targetBusiness?.name ?? '',
    targetBusinessSlug: intro.targetBusiness?.slug ?? '',
  };
}
