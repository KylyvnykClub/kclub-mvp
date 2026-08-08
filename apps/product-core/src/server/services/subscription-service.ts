import {
  ERROR_CODES,
  type CheckoutSessionDto,
  type Locale,
  type SubscriptionDto,
  type SubscriptionStatus,
} from '@kclub/contracts';
import { hasActiveVipAccess } from '@kclub/domain';

import { eq, desc } from 'drizzle-orm';
import { AppError } from '@/server/errors';
import { getDbClient, schema } from '@/server/db';
import { getStripeClient } from '@/server/stripe/client';
import { rethrowStripeCheckoutError } from '@/server/stripe/errors';
import { parseAdminConfigPriceId, resolveStripePriceIdFromEnv } from '@/server/stripe/price-config';
import type { RequestContext } from '@/server/context';
import { createDbAuditService } from '@/server/audit';

const auditService = createDbAuditService();
type VipSubscriptionRecord = typeof schema.vipSubscriptions.$inferSelect;

function buildVipMetadata(userId: string): Record<string, string> {
  return {
    type: 'vip',
    userId,
  };
}

function buildPlacementMetadata(userId: string, businessId: string): Record<string, string> {
  return {
    type: 'business_placement',
    userId,
    businessId,
  };
}

function normalizeAppUrl(url: string): string {
  const stripped = url.replace(/\/+$/, '');
  return stripped.replace(/\/(en|ru|uk)$/, '');
}

function buildSuccessUrl(appUrl: string, locale: Locale): string {
  return `${normalizeAppUrl(appUrl)}/${locale}/m/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
}

function buildCancelUrl(appUrl: string, locale: Locale): string {
  return `${normalizeAppUrl(appUrl)}/${locale}/m/checkout/cancel`;
}

async function getPriceIdForKey(key: string): Promise<string> {
  const db = getDbClient();
  const config = await db.query.adminConfigs.findFirst({ where: eq(schema.adminConfigs.key, key) });
  const priceId = parseAdminConfigPriceId(config?.value) ?? resolveStripePriceIdFromEnv(key);

  if (!priceId) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: config
        ? `Stripe price ID is empty for: ${key}`
        : `Stripe price not configured: ${key}`,
      status: 500,
    });
  }

  return priceId;
}

export async function startVipCheckout(
  userId: string,
  context: RequestContext,
  locale: Locale,
): Promise<CheckoutSessionDto> {
  const db = getDbClient();
  const stripe = getStripeClient();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: 'APP_URL is not configured',
      status: 500,
    });
  }

  const subscription = await db.query.vipSubscriptions.findFirst({
    where: eq(schema.vipSubscriptions.user_id, userId),
    orderBy: [desc(schema.vipSubscriptions.created_at)],
  });
  if (subscription && hasActiveVipAccess(subscription.status)) {
    throw new AppError({
      code: ERROR_CODES.VIP_SUBSCRIPTION_INACTIVE,
      message: 'User already has an active VIP subscription',
      status: 409,
    });
  }

  const priceId = await getPriceIdForKey('stripe_price_vip_membership_monthly');

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: buildVipMetadata(userId),
      subscription_data: {
        metadata: buildVipMetadata(userId),
      },
      client_reference_id: userId,
      success_url: buildSuccessUrl(appUrl, locale),
      cancel_url: buildCancelUrl(appUrl, locale),
    });
  } catch (error) {
    rethrowStripeCheckoutError(error);
  }

  if (!session.url) {
    throw new AppError({
      code: ERROR_CODES.CHECKOUT_CREATION_FAILED,
      message: 'Stripe did not return a checkout URL',
      status: 500,
    });
  }

  return { checkoutUrl: session.url };
}

export async function startPlacementCheckout(
  businessId: string,
  userId: string,
  context: RequestContext,
  locale: Locale,
): Promise<CheckoutSessionDto> {
  const db = getDbClient();
  const stripe = getStripeClient();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: 'APP_URL is not configured',
      status: 500,
    });
  }

  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
  });
  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (business.user_id !== userId) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'You do not own this business profile',
      status: 403,
    });
  }

  if (business.status !== 'APPROVED') {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_NOT_APPROVED,
      message: 'Business must be in APPROVED status to start placement checkout',
      status: 403,
    });
  }

  const priceId = await getPriceIdForKey('stripe_price_business_placement_monthly');

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: buildPlacementMetadata(userId, businessId),
      subscription_data: {
        metadata: buildPlacementMetadata(userId, businessId),
      },
      client_reference_id: userId,
      success_url: buildSuccessUrl(appUrl, locale),
      cancel_url: buildCancelUrl(appUrl, locale),
    });
  } catch (error) {
    rethrowStripeCheckoutError(error);
  }

  if (!session.url) {
    throw new AppError({
      code: ERROR_CODES.CHECKOUT_CREATION_FAILED,
      message: 'Stripe did not return a checkout URL',
      status: 500,
    });
  }

  return { checkoutUrl: session.url };
}

export function toSubscriptionDto(sub: VipSubscriptionRecord): SubscriptionDto {
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

export async function getOwnSubscriptions(userId: string): Promise<SubscriptionDto[]> {
  const db = getDbClient();
  const subs = await db.query.vipSubscriptions.findMany({
    where: eq(schema.vipSubscriptions.user_id, userId),
    orderBy: [desc(schema.vipSubscriptions.created_at)],
  });
  return subs.map(toSubscriptionDto);
}

export async function getOwnSubscriptionDetail(
  userId: string,
  subscriptionId: string,
): Promise<SubscriptionDto> {
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
  if (sub.user_id !== userId) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'You do not own this subscription',
      status: 403,
    });
  }
  return toSubscriptionDto(sub);
}

export async function cancelOwnSubscription(
  userId: string,
  subscriptionId: string,
  context: RequestContext,
): Promise<SubscriptionDto> {
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
  if (sub.user_id !== userId) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'You do not own this subscription',
      status: 403,
    });
  }
  if (sub.status !== 'ACTIVE' && sub.status !== 'PAST_DUE') {
    throw new AppError({
      code: ERROR_CODES.VIP_SUBSCRIPTION_INACTIVE,
      message: 'Only active or past-due subscriptions can be canceled',
      status: 409,
    });
  }

  const [updated] = await db
    .update(schema.vipSubscriptions)
    .set({ cancel_at_period_end: true, canceled_at: new Date() })
    .where(eq(schema.vipSubscriptions.id, subscriptionId))
    .returning();

  await auditService.log(
    {
      action: 'SUBSCRIPTION_CANCELED',
      entityType: 'VipSubscription',
      entityId: subscriptionId,
      before: { cancelAtPeriodEnd: sub.cancel_at_period_end },
      after: { cancelAtPeriodEnd: true },
    },
    context,
  );

  return toSubscriptionDto(updated!);
}

export type InvoiceDto = {
  id: string;
  number: string | null;
  amountPaid: number;
  currency: string;
  status: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  createdAt: string;
};

export async function getOwnInvoices(userId: string): Promise<InvoiceDto[]> {
  const db = getDbClient();
  const stripe = getStripeClient();

  const sub = await db.query.vipSubscriptions.findFirst({
    where: eq(schema.vipSubscriptions.user_id, userId),
    orderBy: [desc(schema.vipSubscriptions.created_at)],
  });

  if (!sub?.stripe_customer_id) return [];

  const invoices = await stripe.invoices.list({
    customer: sub.stripe_customer_id,
    limit: 24,
    expand: ['data.payment_intent'],
  });

  return invoices.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    amountPaid: inv.amount_paid,
    currency: inv.currency,
    status: inv.status ?? null,
    periodStart: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
    periodEnd: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    invoicePdf: inv.invoice_pdf ?? null,
    createdAt: new Date(inv.created * 1000).toISOString(),
  }));
}

export { buildVipMetadata, buildPlacementMetadata, buildSuccessUrl, buildCancelUrl };
