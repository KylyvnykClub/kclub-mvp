import type Stripe from 'stripe';
import {
  ERROR_CODES,
  SUBSCRIPTION_STATUSES,
  type BusinessStatus,
  type SubscriptionStatus,
} from '@kclub/contracts';
import { canTransitionBusinessStatus, hasActiveVipAccess } from '@kclub/domain';
import { revalidateTag } from 'next/cache';

import { AppError } from '@/server/errors';
import { getDbClient, schema } from '@/server/db';
import { eq, desc } from 'drizzle-orm';
import { getStripeClient } from '@/server/stripe/client';
import { createDbAuditService } from '@/server/audit';
import { createRequestContext } from '@/server/context';

const auditService = createDbAuditService();
const systemContext = createRequestContext({ actor: { kind: 'system' } });

export function mapStripeStatusToLocal(
  stripeStatus: string,
  currentPeriodEnd: number | null,
): SubscriptionStatus | null {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
      return 'PAST_DUE';
    case 'canceled': {
      if (currentPeriodEnd && currentPeriodEnd * 1000 > Date.now()) {
        return 'CANCELED';
      }
      return 'EXPIRED';
    }
    default:
      return null;
  }
}

export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  const db = getDbClient();
  const eventId = event.id;

  try {
    await db.insert(schema.stripeWebhookEvents).values({
      eventId: eventId,
      eventType: event.type,
      payload: event as unknown as any,
      handlerStatus: 'RECEIVED',
      livemode: event.livemode ?? false,
    });
  } catch (err: unknown) {
    const dbError = err as { code?: string };
    if (dbError?.code === '23505') { // Postgres unique_violation
      return;
    }
    throw err;
  }

  try {
    await handleEventByType(event);
    await db.update(schema.stripeWebhookEvents)
      .set({ handlerStatus: 'PROCESSED', processedAt: new Date() })
      .where(eq(schema.stripeWebhookEvents.eventId, eventId));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await db.update(schema.stripeWebhookEvents)
      .set({ handlerStatus: 'FAILED', errorMessage })
      .where(eq(schema.stripeWebhookEvents.eventId, eventId));
    throw error;
  }
}

async function handleEventByType(event: Stripe.Event): Promise<void> {
  const object = event.data.object as unknown as Record<string, unknown>;
  const metadata = (object.metadata ?? {}) as Record<string, string>;

  if (event.type === 'checkout.session.completed') {
    if (metadata.type === 'vip') return handleCheckoutCompleted(object);
    if (metadata.type === 'business_placement') return handlePlacementCheckoutCompleted(object);
    return;
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    if (metadata.type !== 'vip' && metadata.type !== undefined) return;
    return handleSubscriptionChange(object);
  }

  if (event.type === 'customer.subscription.deleted') {
    return handleSubscriptionDeleted(object);
  }

  if (event.type === 'invoice.payment_failed') {
    return handlePaymentFailed(object);
  }
}

async function handleCheckoutCompleted(session: Record<string, unknown>): Promise<void> {
  const db = getDbClient();
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const userId = metadata.userId;

  if (!userId) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: 'checkout.session.completed missing userId in metadata',
      status: 500,
    });
  }

  const customerId = session.customer as string | null;
  const subscriptionId = session.subscription as string | null;

  if (!subscriptionId) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: 'checkout.session.completed missing subscription id',
      status: 500,
    });
  }

  const existing = await db.query.vipSubscriptions.findFirst({
    where: eq(schema.vipSubscriptions.userId, userId),
    orderBy: (vs, { desc }) => [desc(vs.createdAt)],
  });

  const createdSubId = await db.transaction(async (tx) => {
    await tx.update(schema.users).set({ membershipTier: 'VIP' }).where(eq(schema.users.id, userId));

    if (existing) {
      const [updated] = await tx.update(schema.vipSubscriptions)
        .set({
          status: 'ACTIVE',
          stripeCustomerId: customerId ?? existing.stripeCustomerId,
          stripeSubscriptionId: subscriptionId,
        })
        .where(eq(schema.vipSubscriptions.id, existing.id))
        .returning();
      return updated.id;
    } else {
      const [created] = await tx.insert(schema.vipSubscriptions)
        .values({
          userId: userId,
          status: 'ACTIVE',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        })
        .returning();
      return created.id;
    }
  });

  await auditService.log(
    {
      action: 'CHECKOUT_CREATED',
      entityType: 'VipSubscription',
      entityId: userId,
      after: { subscriptionId: createdSubId, stripeSubscriptionId: subscriptionId, status: 'ACTIVE' },
    },
    systemContext,
  );
}

export function validatePlacementCheckout(
  metadata: Record<string, string>,
  business: { status: string; userId: string } | null | undefined,
  vipSub: { status: SubscriptionStatus } | null | undefined,
  existingPlacementSub?: { stripeSubscriptionId: string | null; kind: string } | null | undefined,
  sessionSubscriptionId?: string,
): 'VALID' | 'ALREADY_PUBLISHED' {
  const userId = metadata.userId;
  const businessId = metadata.businessId;

  if (!userId || !businessId) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: 'checkout.session.completed missing userId or businessId in metadata',
      status: 500,
    });
  }

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found for placement checkout',
      status: 500,
    });
  }

  if (business.userId !== userId) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: 'Business owner mismatch in placement checkout webhook',
      status: 500,
    });
  }

  if (business.status === 'PUBLISHED') {
    if (
      existingPlacementSub &&
      existingPlacementSub.kind === 'BUSINESS_PLACEMENT' &&
      existingPlacementSub.stripeSubscriptionId === sessionSubscriptionId
    ) {
      return 'ALREADY_PUBLISHED';
    }
    throw new AppError({
      code: ERROR_CODES.BUSINESS_INVALID_STATUS_TRANSITION,
      message: `Business is PUBLISHED but no matching placement subscription found for transition`,
      status: 500,
    });
  }

  if (!canTransitionBusinessStatus(business.status as BusinessStatus, 'PUBLISHED')) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_INVALID_STATUS_TRANSITION,
      message: `Business is ${business.status}, expected APPROVED`,
      status: 500,
    });
  }

  if (!vipSub || !hasActiveVipAccess(vipSub.status)) {
    throw new AppError({
      code: ERROR_CODES.VIP_REQUIRED,
      message: 'Business owner no longer has active VIP access',
      status: 500,
    });
  }

  return 'VALID';
}

export async function handlePlacementCheckoutCompleted(
  session: Record<string, unknown>,
): Promise<void> {
  const db = getDbClient();
  const stripe = getStripeClient();
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const userId = metadata.userId;
  const businessId = metadata.businessId;

  // 1. Validate metadata BEFORE any DB reads
  if (!userId || !businessId) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: 'checkout.session.completed missing userId or businessId in metadata',
      status: 500,
    });
  }

  const subscriptionId = session.subscription as string | null;
  const customerId = session.customer as string | null;

  if (!subscriptionId) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: 'checkout.session.completed missing subscription id',
      status: 500,
    });
  }

  if (!customerId) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: 'checkout.session.completed missing customer id',
      status: 500,
    });
  }

  // 2. DB reads + Stripe subscription fetch in parallel
  const [business, vipSub, existingPlacementSub] = await Promise.all([
    db.query.businessProfiles.findFirst({ where: eq(schema.businessProfiles.id, businessId) }),
    db.query.vipSubscriptions.findFirst({
      where: eq(schema.vipSubscriptions.userId, userId),
      orderBy: (vs, { desc }) => [desc(vs.createdAt)],
    }),
    db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.businessProfileId, businessId), // and kind handled by schema or where
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    }),
  ]);

  // 3. Validate using domain policies with stricter idempotency
  const validation = validatePlacementCheckout(
    metadata,
    business,
    vipSub as { status: SubscriptionStatus } | null,
    existingPlacementSub,
    subscriptionId,
  );
  if (validation === 'ALREADY_PUBLISHED') {
    return;
  }

  // 4. Fetch Stripe subscription for additional fields
  let stripePriceId: string | null = null;
  let currentPeriodStart: Date | null = null;
  let currentPeriodEnd: Date | null = null;
  let cancelAtPeriodEnd = false;

  try {
    const stripeSub: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const firstItem = stripeSub.items?.data?.[0];
    stripePriceId = firstItem?.price?.id ?? null;
    currentPeriodStart = firstItem?.current_period_start
      ? new Date(firstItem.current_period_start * 1000)
      : null;
    currentPeriodEnd = firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000)
      : null;
    cancelAtPeriodEnd = stripeSub.cancel_at_period_end ?? false;
  } catch {
    // Non-critical — details will be synced by subscription webhooks or cron
  }

  // 5. Single transaction: publish business + upsert placement subscription
  await db.transaction(async (tx) => {
    await tx.update(schema.businessProfiles)
      .set({
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featuredTop: false,
        featuredRecommended: false,
      })
      .where(eq(schema.businessProfiles.id, businessId));

    if (existingPlacementSub) {
      await tx.update(schema.subscriptions)
        .set({
          status: 'ACTIVE',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: stripePriceId,
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          cancelAtPeriodEnd: cancelAtPeriodEnd,
        })
        .where(eq(schema.subscriptions.id, existingPlacementSub.id));
    } else {
      await tx.insert(schema.subscriptions)
        .values({
          userId: userId,
          businessProfileId: businessId,
          kind: 'BUSINESS_PLACEMENT',
          status: 'ACTIVE',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: stripePriceId,
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          cancelAtPeriodEnd: cancelAtPeriodEnd,
        });
    }
  });

  // 6. Revalidate public business cache
  revalidateTag('businesses');
  revalidateTag('public-businesses');

  // 7. Audit log after transaction
  await auditService.log(
    {
      action: 'BUSINESS_PUBLISHED',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: { status: 'APPROVED' },
      after: { status: 'PUBLISHED', stripeSubscriptionId: subscriptionId },
    },
    systemContext,
  );
}

async function handleSubscriptionChange(subscription: Record<string, unknown>): Promise<void> {
  const db = getDbClient();
  const subscriptionId = subscription.id as string;

  const localSub = await db.query.vipSubscriptions.findFirst({
    where: eq(schema.vipSubscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!localSub) {
    return;
  }

  const stripeStatus = subscription.status as string;
  const currentPeriodEnd = subscription.current_period_end as number | null;
  const newStatus = mapStripeStatusToLocal(stripeStatus, currentPeriodEnd);

  if (!newStatus) {
    return;
  }

  const canceledAt = subscription.canceled_at as number | null;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end as boolean;

  const updateData: Partial<typeof schema.vipSubscriptions.$inferInsert> = {
    status: newStatus,
    currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
    cancelAtPeriodEnd: cancelAtPeriodEnd,
  };

  if (canceledAt) {
    updateData.canceledAt = new Date(canceledAt * 1000);
  }

  const previousStatus = localSub.status;

  await db.update(schema.vipSubscriptions).set(updateData).where(eq(schema.vipSubscriptions.id, localSub.id));

  if (previousStatus !== newStatus) {
    await auditService.log(
      {
        action: 'SUBSCRIPTION_SYNCED',
        entityType: 'VipSubscription',
        entityId: localSub.userId,
        before: { status: previousStatus },
        after: { status: newStatus },
      },
      systemContext,
    );
  }
}

async function handleSubscriptionDeleted(subscription: Record<string, unknown>): Promise<void> {
  const db = getDbClient();
  const subscriptionId = subscription.id as string;

  const localSub = await db.query.vipSubscriptions.findFirst({
    where: eq(schema.vipSubscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!localSub) {
    return;
  }

  const previousStatus = localSub.status;

  await db.transaction(async (tx) => {
    await tx.update(schema.users).set({ membershipTier: 'MEMBER' }).where(eq(schema.users.id, localSub.userId));
    await tx.update(schema.vipSubscriptions).set({
      status: 'EXPIRED',
      expiresAt: new Date(),
      cancelAtPeriodEnd: false,
    }).where(eq(schema.vipSubscriptions.id, localSub.id));
  });

  await auditService.log(
    {
      action: 'SUBSCRIPTION_SYNCED',
      entityType: 'VipSubscription',
      entityId: localSub.id,
      before: { status: previousStatus },
      after: { status: 'EXPIRED' },
    },
    systemContext,
  );
}

async function handlePaymentFailed(invoice: Record<string, unknown>): Promise<void> {
  const db = getDbClient();
  const subscriptionId = invoice.subscription as string;

  const localSub = await db.query.vipSubscriptions.findFirst({
    where: eq(schema.vipSubscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!localSub) {
    return;
  }

  const previousStatus = localSub.status;

  await db.update(schema.vipSubscriptions).set({ status: 'PAST_DUE' }).where(eq(schema.vipSubscriptions.id, localSub.id));

  if (previousStatus !== 'PAST_DUE') {
    await auditService.log(
      {
        action: 'SUBSCRIPTION_SYNCED',
        entityType: 'VipSubscription',
        entityId: localSub.id,
        before: { status: previousStatus },
        after: { status: 'PAST_DUE' },
      },
      systemContext,
    );
  }
}
