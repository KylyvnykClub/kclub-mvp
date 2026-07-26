import type Stripe from 'stripe';
import {
  ERROR_CODES,
  SUBSCRIPTION_STATUSES,
  type BusinessStatus,
  type SubscriptionStatus,
} from '@kclub/contracts';
import { canTransitionBusinessStatus, hasActiveVipAccess } from '@kclub/domain';
import { revalidateTag } from 'next/cache';
import { eq, and, desc } from 'drizzle-orm';

import { AppError } from '@/server/errors';
import { getDbClient, schema } from '@/server/db';
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
      event_id: eventId,
      event_type: event.type,
      payload: event as unknown as any,
      handler_status: 'RECEIVED',
      livemode: event.livemode ?? false,
    });
  } catch (err: unknown) {
    // Unique constraint violation in Postgres (Postgres error code 23505)
    if (typeof err === 'object' && err !== null && 'code' in err && (err as any).code === '23505') {
      return;
    }
    throw err;
  }

  try {
    await handleEventByType(event);
    await db
      .update(schema.stripeWebhookEvents)
      .set({ handler_status: 'PROCESSED', processed_at: new Date() })
      .where(eq(schema.stripeWebhookEvents.event_id, eventId));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await db
      .update(schema.stripeWebhookEvents)
      .set({ handler_status: 'FAILED', error_message: errorMessage })
      .where(eq(schema.stripeWebhookEvents.event_id, eventId));
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

  const existingRes = await db
    .select()
    .from(schema.vipSubscriptions)
    .where(eq(schema.vipSubscriptions.user_id, userId))
    .orderBy(desc(schema.vipSubscriptions.created_at))
    .limit(1);
  const existing = existingRes[0];

  const createdSub = await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ membership_tier: 'VIP' })
      .where(eq(schema.users.id, userId));

    if (existing) {
      const res = await tx
        .update(schema.vipSubscriptions)
        .set({
          status: 'ACTIVE',
          stripe_customer_id: customerId ?? existing.stripe_customer_id,
          stripe_subscription_id: subscriptionId,
        })
        .where(eq(schema.vipSubscriptions.id, existing.id))
        .returning();
      return res[0];
    } else {
      const res = await tx
        .insert(schema.vipSubscriptions)
        .values({
          user_id: userId,
          status: 'ACTIVE',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        })
        .returning();
      return res[0];
    }
  });

  await auditService.log(
    {
      action: 'CHECKOUT_CREATED',
      entityType: 'VipSubscription',
      entityId: userId,
      after: {
        subscriptionId: createdSub!.id,
        stripeSubscriptionId: subscriptionId,
        status: 'ACTIVE',
      },
    },
    systemContext,
  );
}

export function validatePlacementCheckout(
  metadata: Record<string, string>,
  business: { status: string; user_id: string } | null,
  vipSub: { status: SubscriptionStatus } | null,
  existingPlacementSub?: { stripe_subscription_id: string | null; kind: string } | null,
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

  if (business.user_id !== userId) {
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
      existingPlacementSub.stripe_subscription_id === sessionSubscriptionId
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

  const [businessRes, vipSubRes, existingPlacementSubRes] = await Promise.all([
    db
      .select()
      .from(schema.businessProfiles)
      .where(eq(schema.businessProfiles.id, businessId))
      .limit(1),
    db
      .select()
      .from(schema.vipSubscriptions)
      .where(eq(schema.vipSubscriptions.user_id, userId))
      .orderBy(desc(schema.vipSubscriptions.created_at))
      .limit(1),
    db
      .select()
      .from(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.business_profile_id, businessId),
          eq(schema.subscriptions.kind, 'BUSINESS_PLACEMENT'),
        ),
      )
      .orderBy(desc(schema.subscriptions.created_at))
      .limit(1),
  ]);

  const business = businessRes[0] ?? null;
  const vipSub = vipSubRes[0] ?? null;
  const existingPlacementSub = existingPlacementSubRes[0] ?? null;

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
    // Non-critical
  }

  // Payment activates the placement subscription only. The business stays
  // APPROVED until an admin publishes it manually from the admin app.
  await db.transaction(async (tx) => {
    if (existingPlacementSub) {
      await tx
        .update(schema.subscriptions)
        .set({
          status: 'ACTIVE',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: stripePriceId,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
        })
        .where(eq(schema.subscriptions.id, existingPlacementSub.id));
    } else {
      await tx.insert(schema.subscriptions).values({
        user_id: userId,
        business_profile_id: businessId,
        kind: 'BUSINESS_PLACEMENT',
        status: 'ACTIVE',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: stripePriceId,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: cancelAtPeriodEnd,
      });
    }
  });

  revalidateTag('businesses');
  revalidateTag('public-businesses');

  await auditService.log(
    {
      action: 'BUSINESS_PLACEMENT_PAID',
      entityType: 'BusinessProfile',
      entityId: businessId,
      before: {
        status: business?.status ?? null,
        placementSubscriptionStatus: existingPlacementSub?.status ?? null,
      },
      after: {
        status: business?.status ?? null,
        placementSubscriptionStatus: 'ACTIVE',
        stripeSubscriptionId: subscriptionId,
      },
    },
    systemContext,
  );
}

async function handleSubscriptionChange(subscription: Record<string, unknown>): Promise<void> {
  const db = getDbClient();
  const subscriptionId = subscription.id as string;

  const localSubRes = await db
    .select()
    .from(schema.vipSubscriptions)
    .where(eq(schema.vipSubscriptions.stripe_subscription_id, subscriptionId))
    .limit(1);
  const localSub = localSubRes[0];

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

  const updateData: any = {
    status: newStatus,
    current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
    cancel_at_period_end: cancelAtPeriodEnd,
  };

  if (canceledAt) {
    updateData.canceled_at = new Date(canceledAt * 1000);
  }

  const previousStatus = localSub.status;

  await db
    .update(schema.vipSubscriptions)
    .set(updateData)
    .where(eq(schema.vipSubscriptions.id, localSub.id));

  if (previousStatus !== newStatus) {
    await auditService.log(
      {
        action: 'SUBSCRIPTION_SYNCED',
        entityType: 'VipSubscription',
        entityId: localSub.user_id,
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

  const localSubRes = await db
    .select()
    .from(schema.vipSubscriptions)
    .where(eq(schema.vipSubscriptions.stripe_subscription_id, subscriptionId))
    .limit(1);
  const localSub = localSubRes[0];

  if (!localSub) {
    return;
  }

  const previousStatus = localSub.status;

  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ membership_tier: 'MEMBER' })
      .where(eq(schema.users.id, localSub.user_id));

    await tx
      .update(schema.vipSubscriptions)
      .set({
        status: 'EXPIRED',
        expires_at: new Date(),
        cancel_at_period_end: false,
      })
      .where(eq(schema.vipSubscriptions.id, localSub.id));
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

  const localSubRes = await db
    .select()
    .from(schema.vipSubscriptions)
    .where(eq(schema.vipSubscriptions.stripe_subscription_id, subscriptionId))
    .limit(1);
  const localSub = localSubRes[0];

  if (!localSub) {
    return;
  }

  const previousStatus = localSub.status;

  await db
    .update(schema.vipSubscriptions)
    .set({ status: 'PAST_DUE' })
    .where(eq(schema.vipSubscriptions.id, localSub.id));

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
