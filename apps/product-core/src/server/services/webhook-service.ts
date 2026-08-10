import type Stripe from 'stripe';
import {
  ERROR_CODES,
  type SubscriptionKind,
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
import { submitBusinessReviewAfterReserve } from '@/server/services/business-service';

const auditService = createDbAuditService();
const systemContext = createRequestContext({ actor: { kind: 'system' } });
const WEBHOOK_STATUS_PROCESSING = 'PROCESSING';
const WEBHOOK_STATUS_PROCESSED = 'PROCESSED';
const WEBHOOK_STATUS_FAILED = 'FAILED';

type StripeWebhookEventRecord = typeof schema.stripeWebhookEvents.$inferSelect;
type PlacementSubscriptionRecord = typeof schema.subscriptions.$inferSelect;
type VipSubscriptionRecord = typeof schema.vipSubscriptions.$inferSelect;
type BusinessProfileRecord = typeof schema.businessProfiles.$inferSelect;

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

/**
 * True when the configured secret key targets Stripe live mode.
 * Guards against a sandbox endpoint being pointed at a production deployment
 * (or vice versa), which would otherwise mutate real subscriptions from test
 * events that happen to carry a valid signature for the configured secret.
 */
export function isLiveModeConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ?? false;
}

export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  const db = getDbClient();
  const eventId = event.id;

  if ((event.livemode ?? false) !== isLiveModeConfigured()) {
    // Acknowledge without processing: retrying will never help, and persisting
    // the event would pollute the ledger of the opposite environment.
    return;
  }

  const claimResult = await claimStripeEvent(event);

  if (claimResult !== 'CLAIMED') {
    return;
  }

  try {
    await handleEventByType(event);
    await db
      .update(schema.stripeWebhookEvents)
      .set({
        handler_status: WEBHOOK_STATUS_PROCESSED,
        processed_at: new Date(),
        error_message: null,
      })
      .where(eq(schema.stripeWebhookEvents.event_id, eventId));
  } catch (error) {
    const errorMessage = toWebhookErrorMessage(error);
    await db
      .update(schema.stripeWebhookEvents)
      .set({ handler_status: WEBHOOK_STATUS_FAILED, error_message: errorMessage })
      .where(eq(schema.stripeWebhookEvents.event_id, eventId));
    throw error;
  }
}

type WebhookClaimResult = 'CLAIMED' | 'ALREADY_PROCESSED' | 'ALREADY_PROCESSING';

async function claimStripeEvent(event: Stripe.Event): Promise<WebhookClaimResult> {
  const db = getDbClient();

  try {
    await db.insert(schema.stripeWebhookEvents).values({
      event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
      handler_status: WEBHOOK_STATUS_PROCESSING,
      livemode: event.livemode ?? false,
      processed_at: null,
      error_message: null,
    });
    return 'CLAIMED';
  } catch (error: unknown) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }

  const existingEvent = await getWebhookEventRecord(event.id);
  if (!existingEvent) {
    throw new AppError({
      code: ERROR_CODES.SERVER_DEPENDENCY_UNAVAILABLE,
      message: `Webhook event ${event.id} exists but could not be loaded`,
      status: 500,
    });
  }

  if (existingEvent.handler_status === WEBHOOK_STATUS_PROCESSED) {
    return 'ALREADY_PROCESSED';
  }

  if (existingEvent.handler_status !== WEBHOOK_STATUS_FAILED) {
    return 'ALREADY_PROCESSING';
  }

  const claimed = await db
    .update(schema.stripeWebhookEvents)
    .set({
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
      livemode: event.livemode ?? false,
      handler_status: WEBHOOK_STATUS_PROCESSING,
      processed_at: null,
      error_message: null,
    })
    .where(
      and(
        eq(schema.stripeWebhookEvents.event_id, event.id),
        eq(schema.stripeWebhookEvents.handler_status, WEBHOOK_STATUS_FAILED),
      ),
    )
    .returning({ event_id: schema.stripeWebhookEvents.event_id });

  if (claimed.length > 0) {
    return 'CLAIMED';
  }

  const retriedEvent = await getWebhookEventRecord(event.id);
  if (retriedEvent?.handler_status === WEBHOOK_STATUS_PROCESSED) {
    return 'ALREADY_PROCESSED';
  }

  return 'ALREADY_PROCESSING';
}

async function getWebhookEventRecord(eventId: string): Promise<StripeWebhookEventRecord | null> {
  const db = getDbClient();
  const rows = await db
    .select()
    .from(schema.stripeWebhookEvents)
    .where(eq(schema.stripeWebhookEvents.event_id, eventId))
    .limit(1);
  return rows[0] ?? null;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

function toWebhookErrorMessage(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : 'Unknown error';
  return rawMessage.slice(0, 1000);
}

async function handleEventByType(event: Stripe.Event): Promise<void> {
  const object = event.data.object as unknown as Record<string, unknown>;
  const metadata = (object.metadata ?? {}) as Record<string, string>;

  if (event.type === 'checkout.session.completed') {
    if (metadata.type === 'vip') return handleCheckoutCompleted(object);
    if (metadata.type === 'business_placement') return handlePlacementCheckoutCompleted(object);
    return;
  }

  if (event.type === 'payment_intent.amount_capturable_updated') {
    if (metadata.type === 'business_review_reserve') {
      return submitBusinessReviewAfterReserve(event.data.object as Stripe.PaymentIntent);
    }
    return;
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
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
  const metadata = (subscription.metadata ?? {}) as Record<string, string>;
  const subscriptionKind = await resolveSubscriptionKind(subscriptionId, metadata.type);

  if (subscriptionKind === 'BUSINESS_PLACEMENT') {
    return handlePlacementSubscriptionChange(subscription, subscriptionId);
  }

  if (subscriptionKind !== 'VIP_MEMBERSHIP') {
    return;
  }

  const localSub = await getVipSubscriptionByStripeId(subscriptionId);
  if (!localSub) return;

  const stripeStatus = subscription.status as string;
  const currentPeriodEnd = readSubscriptionPeriod(subscription, 'current_period_end');
  const newStatus = mapStripeStatusToLocal(stripeStatus, currentPeriodEnd);

  if (!newStatus) {
    return;
  }

  const canceledAt = subscription.canceled_at as number | null;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end as boolean;

  const updateData: {
    status: SubscriptionStatus;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
    canceled_at?: Date;
  } = {
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
  const subscriptionId = subscription.id as string;
  const metadata = (subscription.metadata ?? {}) as Record<string, string>;
  const subscriptionKind = await resolveSubscriptionKind(subscriptionId, metadata.type);

  if (subscriptionKind === 'BUSINESS_PLACEMENT') {
    return handlePlacementSubscriptionDeleted(subscription, subscriptionId);
  }

  if (subscriptionKind !== 'VIP_MEMBERSHIP') {
    return;
  }

  const db = getDbClient();
  const localSub = await getVipSubscriptionByStripeId(subscriptionId);
  if (!localSub) return;

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
  const subscriptionId = readInvoiceSubscriptionId(invoice);
  if (!subscriptionId) {
    return;
  }

  const metadata = (
    invoice.lines as { data?: Array<{ metadata?: Record<string, string> }> } | undefined
  )?.data?.[0]?.metadata;
  const subscriptionKind = await resolveSubscriptionKind(subscriptionId, metadata?.type);

  if (subscriptionKind === 'BUSINESS_PLACEMENT') {
    return handlePlacementPaymentFailed(subscriptionId);
  }

  if (subscriptionKind !== 'VIP_MEMBERSHIP') {
    return;
  }

  const db = getDbClient();
  const localSub = await getVipSubscriptionByStripeId(subscriptionId);
  if (!localSub) return;

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

/**
 * Billing period boundaries moved from Subscription to SubscriptionItem in API
 * 2025-03-31.basil. Read the item first, fall back to the legacy top-level
 * field so replayed/older events still resolve.
 */
export function readSubscriptionPeriod(
  subscription: Record<string, unknown>,
  boundary: 'current_period_start' | 'current_period_end',
): number | null {
  const items = (subscription.items as { data?: Array<Record<string, unknown>> } | undefined)?.data;
  const fromItem = items?.[0]?.[boundary];
  if (typeof fromItem === 'number') {
    return fromItem;
  }

  const fromRoot = subscription[boundary];
  return typeof fromRoot === 'number' ? fromRoot : null;
}

function toStripeId(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === 'string' ? id : null;
  }

  return null;
}

/**
 * Invoice.subscription was replaced by parent.subscription_details.subscription
 * in API 2025-03-31.basil.
 */
export function readInvoiceSubscriptionId(invoice: Record<string, unknown>): string | null {
  const parent = invoice.parent as
    { subscription_details?: { subscription?: unknown } | null } | null | undefined;

  return toStripeId(parent?.subscription_details?.subscription) ?? toStripeId(invoice.subscription);
}

async function resolveSubscriptionKind(
  stripeSubscriptionId: string,
  rawType?: string,
): Promise<SubscriptionKind | null> {
  if (rawType === 'vip') return 'VIP_MEMBERSHIP';
  if (rawType === 'business_placement') return 'BUSINESS_PLACEMENT';

  const [vipSubscription, placementSubscription] = await Promise.all([
    getVipSubscriptionByStripeId(stripeSubscriptionId),
    getPlacementSubscriptionByStripeId(stripeSubscriptionId),
  ]);

  if (placementSubscription) return 'BUSINESS_PLACEMENT';
  if (vipSubscription) return 'VIP_MEMBERSHIP';
  return null;
}

async function getVipSubscriptionByStripeId(
  stripeSubscriptionId: string,
): Promise<VipSubscriptionRecord | null> {
  const db = getDbClient();
  const rows = await db
    .select()
    .from(schema.vipSubscriptions)
    .where(eq(schema.vipSubscriptions.stripe_subscription_id, stripeSubscriptionId))
    .limit(1);
  return rows[0] ?? null;
}

async function getPlacementSubscriptionByStripeId(
  stripeSubscriptionId: string,
): Promise<PlacementSubscriptionRecord | null> {
  const db = getDbClient();
  const rows = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.stripe_subscription_id, stripeSubscriptionId))
    .limit(1);
  return rows[0] ?? null;
}

async function handlePlacementSubscriptionChange(
  subscription: Record<string, unknown>,
  subscriptionId: string,
): Promise<void> {
  const db = getDbClient();
  const localSub = await getPlacementSubscriptionByStripeId(subscriptionId);
  if (!localSub || localSub.kind !== 'BUSINESS_PLACEMENT') return;

  const stripeStatus = subscription.status as string;
  const currentPeriodEnd = readSubscriptionPeriod(subscription, 'current_period_end');
  const currentPeriodStart = readSubscriptionPeriod(subscription, 'current_period_start');
  const newStatus = mapStripeStatusToLocal(stripeStatus, currentPeriodEnd);
  if (!newStatus) return;

  const canceledAt = subscription.canceled_at as number | null;
  const cancelAtPeriodEnd = (subscription.cancel_at_period_end as boolean | null) ?? false;
  const previousStatus = localSub.status;

  const updateData: Partial<PlacementSubscriptionRecord> = {
    status: newStatus,
    current_period_start: currentPeriodStart ? new Date(currentPeriodStart * 1000) : null,
    current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
    cancel_at_period_end: cancelAtPeriodEnd,
    stripe_customer_id:
      typeof subscription.customer === 'string'
        ? subscription.customer
        : localSub.stripe_customer_id,
  };

  if (canceledAt) {
    updateData.canceled_at = new Date(canceledAt * 1000);
  }

  await db
    .update(schema.subscriptions)
    .set(updateData)
    .where(eq(schema.subscriptions.id, localSub.id));

  await logPlacementSubscriptionSync(localSub, previousStatus, newStatus);

  if (newStatus === 'EXPIRED') {
    await hideBusinessForPlacementLoss(
      localSub.business_profile_id,
      'Placement subscription expired',
    );
  } else {
    revalidateTag('businesses');
    revalidateTag('public-businesses');
  }
}

async function handlePlacementSubscriptionDeleted(
  subscription: Record<string, unknown>,
  subscriptionId: string,
): Promise<void> {
  const db = getDbClient();
  const localSub = await getPlacementSubscriptionByStripeId(subscriptionId);
  if (!localSub || localSub.kind !== 'BUSINESS_PLACEMENT') return;

  const currentPeriodEnd = readSubscriptionPeriod(subscription, 'current_period_end');
  const nextStatus = mapStripeStatusToLocal('canceled', currentPeriodEnd) ?? 'EXPIRED';
  const previousStatus = localSub.status;

  await db
    .update(schema.subscriptions)
    .set({
      status: nextStatus,
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      cancel_at_period_end: false,
      canceled_at: new Date(),
    })
    .where(eq(schema.subscriptions.id, localSub.id));

  await logPlacementSubscriptionSync(localSub, previousStatus, nextStatus);

  if (nextStatus === 'EXPIRED') {
    await hideBusinessForPlacementLoss(
      localSub.business_profile_id,
      'Placement subscription deleted',
    );
  } else {
    revalidateTag('businesses');
    revalidateTag('public-businesses');
  }
}

async function handlePlacementPaymentFailed(subscriptionId: string): Promise<void> {
  const db = getDbClient();
  const localSub = await getPlacementSubscriptionByStripeId(subscriptionId);
  if (!localSub || localSub.kind !== 'BUSINESS_PLACEMENT') return;

  const previousStatus = localSub.status;

  await db
    .update(schema.subscriptions)
    .set({ status: 'PAST_DUE' })
    .where(eq(schema.subscriptions.id, localSub.id));

  await logPlacementSubscriptionSync(localSub, previousStatus, 'PAST_DUE');
  revalidateTag('businesses');
  revalidateTag('public-businesses');
}

async function logPlacementSubscriptionSync(
  subscription: PlacementSubscriptionRecord,
  previousStatus: SubscriptionStatus,
  newStatus: SubscriptionStatus,
): Promise<void> {
  if (previousStatus === newStatus) {
    return;
  }

  await auditService.log(
    {
      action: 'SUBSCRIPTION_SYNCED',
      entityType: 'Subscription',
      entityId: subscription.id,
      before: { status: previousStatus, kind: subscription.kind },
      after: { status: newStatus, kind: subscription.kind },
    },
    systemContext,
  );
}

async function hideBusinessForPlacementLoss(
  businessId: string | null,
  reason: string,
): Promise<void> {
  if (!businessId) return;

  const db = getDbClient();
  const businessRows = await db
    .select()
    .from(schema.businessProfiles)
    .where(eq(schema.businessProfiles.id, businessId))
    .limit(1);
  const business = businessRows[0] as BusinessProfileRecord | undefined;

  if (!business || business.status !== 'PUBLISHED') {
    revalidateTag('businesses');
    revalidateTag('public-businesses');
    return;
  }

  await db
    .update(schema.businessProfiles)
    .set({
      status: 'HIDDEN',
      hidden_at: new Date(),
      featured_top: false,
      featured_recommended: false,
    })
    .where(eq(schema.businessProfiles.id, businessId));

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
      after: {
        status: 'HIDDEN',
        featuredTop: false,
        featuredRecommended: false,
        reason,
      },
    },
    systemContext,
  );

  revalidateTag('businesses');
  revalidateTag('public-businesses');
}
