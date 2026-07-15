import { unstable_cache } from 'next/cache';
import { and, asc, count, desc, eq, gte, inArray, isNotNull, lt } from 'drizzle-orm';
import type Stripe from 'stripe';

import {
  SUBSCRIPTION_STATUSES,
  type FinanceDashboardDto,
  type FinanceRecentPaymentDto,
  type FinanceRevenuePointDto,
  type FinanceUpcomingRenewalDto,
  type SubscriptionKind,
  type SubscriptionStatus,
} from '@kclub/contracts';

import { getDbClient, schema } from '@/server/db';
import { listPaidInvoicesSince } from '@/server/stripe/finance-metrics';
import { getInvoiceSubscriptionId } from '@/server/stripe/invoice-receipts';

const MONTHS_IN_CHART = 12;
const RECENT_PAYMENTS_LIMIT = 10;
const UPCOMING_RENEWALS_LIMIT = 8;
const DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_CURRENCY = 'usd';

const RENEWABLE_STATUSES = ['ACTIVE', 'PAST_DUE'] as const satisfies readonly SubscriptionStatus[];

function toUtcMonthKey(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}`;
}

/** Trailing 12 UTC month keys ('YYYY-MM'), oldest first, ending at `now`'s month. */
export function buildFinanceMonthKeys(now: Date): string[] {
  const keys: string[] = [];
  for (let offset = MONTHS_IN_CHART - 1; offset >= 0; offset -= 1) {
    keys.push(
      toUtcMonthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1))),
    );
  }
  return keys;
}

/** Unix timestamp (seconds) for the first day of the oldest charted month. */
export function financeWindowStartUnix(now: Date): number {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS_IN_CHART - 1), 1);
  return Math.floor(start / 1000);
}

export type FinanceInvoiceAggregation = Pick<
  FinanceDashboardDto,
  | 'currency'
  | 'revenue30d'
  | 'revenuePrev30d'
  | 'revenueByKind'
  | 'monthlyRevenue'
  | 'recentPayments'
>;

function pickDominantCurrency(invoices: readonly Stripe.Invoice[]): string {
  const counts = new Map<string, number>();
  for (const invoice of invoices) {
    counts.set(invoice.currency, (counts.get(invoice.currency) ?? 0) + 1);
  }
  let dominant = FALLBACK_CURRENCY;
  let best = 0;
  for (const [currency, occurrences] of counts) {
    if (occurrences > best) {
      dominant = currency;
      best = occurrences;
    }
  }
  return dominant;
}

/**
 * Pure aggregation over paid Stripe invoices. Only invoices in the dominant
 * currency are summed; foreign-currency invoices are excluded from totals
 * (documented limitation) but still count toward `recentPayments`.
 */
export function aggregateFinanceInvoices(
  invoices: readonly Stripe.Invoice[],
  kindBySubscriptionId: ReadonlyMap<string, SubscriptionKind>,
  now: Date,
): FinanceInvoiceAggregation {
  const currency = pickDominantCurrency(invoices);
  const monthKeys = buildFinanceMonthKeys(now);
  const buckets = new Map<string, FinanceRevenuePointDto>(
    monthKeys.map((month) => [month, { month, vip: 0, businessPlacement: 0, other: 0, total: 0 }]),
  );

  const revenueByKind = { vip: 0, businessPlacement: 0, other: 0 };
  let revenue30d = 0;
  let revenuePrev30d = 0;
  const nowMs = now.getTime();
  const cutoff30 = nowMs - 30 * DAY_MS;
  const cutoff60 = nowMs - 60 * DAY_MS;

  for (const invoice of invoices) {
    if (invoice.currency !== currency) continue;

    const createdMs = invoice.created * 1000;
    const subscriptionId = getInvoiceSubscriptionId(invoice);
    const kind = subscriptionId ? (kindBySubscriptionId.get(subscriptionId) ?? null) : null;
    const amount = invoice.amount_paid;

    if (kind === 'VIP_MEMBERSHIP') revenueByKind.vip += amount;
    else if (kind === 'BUSINESS_PLACEMENT') revenueByKind.businessPlacement += amount;
    else revenueByKind.other += amount;

    if (createdMs >= cutoff30 && createdMs <= nowMs) revenue30d += amount;
    else if (createdMs >= cutoff60 && createdMs < cutoff30) revenuePrev30d += amount;

    const bucket = buckets.get(toUtcMonthKey(new Date(createdMs)));
    if (bucket) {
      if (kind === 'VIP_MEMBERSHIP') bucket.vip += amount;
      else if (kind === 'BUSINESS_PLACEMENT') bucket.businessPlacement += amount;
      else bucket.other += amount;
      bucket.total += amount;
    }
  }

  const recentPayments: FinanceRecentPaymentDto[] = [...invoices]
    .sort((a, b) => b.created - a.created)
    .slice(0, RECENT_PAYMENTS_LIMIT)
    .map((invoice) => {
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      return {
        id: invoice.id,
        number: invoice.number,
        customerName: invoice.customer_name ?? invoice.customer_email ?? null,
        kind: subscriptionId ? (kindBySubscriptionId.get(subscriptionId) ?? null) : null,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        invoicePdf: invoice.invoice_pdf ?? null,
        createdAt: new Date(invoice.created * 1000).toISOString(),
      };
    });

  return {
    currency,
    revenue30d,
    revenuePrev30d,
    revenueByKind,
    monthlyRevenue: monthKeys.map((month) => buckets.get(month)!),
    recentPayments,
  };
}

async function computeFinanceDashboard(): Promise<FinanceDashboardDto> {
  const db = getDbClient();
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * DAY_MS);
  const d60 = new Date(now.getTime() - 60 * DAY_MS);

  const [
    vipByStatus,
    placementByStatus,
    vipNew30,
    placementNew30,
    vipNewPrev30,
    placementNewPrev30,
    vipKindRows,
    subKindRows,
    upcomingPlacements,
    upcomingVip,
  ] = await Promise.all([
    db
      .select({ status: schema.vipSubscriptions.status, total: count() })
      .from(schema.vipSubscriptions)
      .groupBy(schema.vipSubscriptions.status),
    db
      .select({ status: schema.subscriptions.status, total: count() })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.kind, 'BUSINESS_PLACEMENT'))
      .groupBy(schema.subscriptions.status),
    db.$count(schema.vipSubscriptions, gte(schema.vipSubscriptions.created_at, d30)),
    db.$count(
      schema.subscriptions,
      and(
        eq(schema.subscriptions.kind, 'BUSINESS_PLACEMENT'),
        gte(schema.subscriptions.created_at, d30),
      ),
    ),
    db.$count(
      schema.vipSubscriptions,
      and(
        gte(schema.vipSubscriptions.created_at, d60),
        lt(schema.vipSubscriptions.created_at, d30),
      ),
    ),
    db.$count(
      schema.subscriptions,
      and(
        eq(schema.subscriptions.kind, 'BUSINESS_PLACEMENT'),
        gte(schema.subscriptions.created_at, d60),
        lt(schema.subscriptions.created_at, d30),
      ),
    ),
    db
      .select({ stripeSubscriptionId: schema.vipSubscriptions.stripe_subscription_id })
      .from(schema.vipSubscriptions)
      .where(isNotNull(schema.vipSubscriptions.stripe_subscription_id)),
    db
      .select({
        stripeSubscriptionId: schema.subscriptions.stripe_subscription_id,
        kind: schema.subscriptions.kind,
      })
      .from(schema.subscriptions)
      .where(isNotNull(schema.subscriptions.stripe_subscription_id)),
    db.query.subscriptions.findMany({
      where: and(
        eq(schema.subscriptions.kind, 'BUSINESS_PLACEMENT'),
        inArray(schema.subscriptions.status, [...RENEWABLE_STATUSES]),
        isNotNull(schema.subscriptions.current_period_end),
        gte(schema.subscriptions.current_period_end, now),
      ),
      with: {
        user: { columns: { display_name: true, phone: true } },
        businessProfile: { columns: { name: true } },
      },
      orderBy: [asc(schema.subscriptions.current_period_end)],
      limit: UPCOMING_RENEWALS_LIMIT,
    }),
    db
      .select({
        id: schema.vipSubscriptions.id,
        status: schema.vipSubscriptions.status,
        currentPeriodEnd: schema.vipSubscriptions.current_period_end,
        cancelAtPeriodEnd: schema.vipSubscriptions.cancel_at_period_end,
        userDisplayName: schema.users.display_name,
        userPhone: schema.users.phone,
      })
      .from(schema.vipSubscriptions)
      .innerJoin(schema.users, eq(schema.vipSubscriptions.user_id, schema.users.id))
      .where(
        and(
          inArray(schema.vipSubscriptions.status, [...RENEWABLE_STATUSES]),
          isNotNull(schema.vipSubscriptions.current_period_end),
          gte(schema.vipSubscriptions.current_period_end, now),
        ),
      )
      .orderBy(asc(schema.vipSubscriptions.current_period_end))
      .limit(UPCOMING_RENEWALS_LIMIT),
  ]);

  const statusTotals = new Map<SubscriptionStatus, number>();
  for (const row of [...vipByStatus, ...placementByStatus]) {
    statusTotals.set(row.status, (statusTotals.get(row.status) ?? 0) + row.total);
  }
  const subscriptionsByStatus = SUBSCRIPTION_STATUSES.filter(
    (status) => (statusTotals.get(status) ?? 0) > 0,
  ).map((status) => ({ status, count: statusTotals.get(status) ?? 0 }));

  const vipActive = vipByStatus.find((row) => row.status === 'ACTIVE')?.total ?? 0;
  const vipPastDue = vipByStatus.find((row) => row.status === 'PAST_DUE')?.total ?? 0;
  const placementActive = placementByStatus.find((row) => row.status === 'ACTIVE')?.total ?? 0;
  const placementPastDue = placementByStatus.find((row) => row.status === 'PAST_DUE')?.total ?? 0;

  const kindBySubscriptionId = new Map<string, SubscriptionKind>();
  for (const row of subKindRows) {
    if (row.stripeSubscriptionId) kindBySubscriptionId.set(row.stripeSubscriptionId, row.kind);
  }
  for (const row of vipKindRows) {
    if (row.stripeSubscriptionId)
      kindBySubscriptionId.set(row.stripeSubscriptionId, 'VIP_MEMBERSHIP');
  }

  const invoices = await listPaidInvoicesSince(financeWindowStartUnix(now));
  const aggregation = aggregateFinanceInvoices(invoices, kindBySubscriptionId, now);

  const upcomingRenewals: FinanceUpcomingRenewalDto[] = [
    ...upcomingPlacements.map((sub) => ({
      subscriptionId: sub.id,
      kind: 'BUSINESS_PLACEMENT' as const,
      status: sub.status,
      userDisplayName: sub.user?.display_name ?? sub.user?.phone ?? null,
      businessName: sub.businessProfile?.name ?? null,
      currentPeriodEnd: sub.current_period_end!.toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    })),
    ...upcomingVip.map((sub) => ({
      subscriptionId: sub.id,
      kind: 'VIP_MEMBERSHIP' as const,
      status: sub.status,
      userDisplayName: sub.userDisplayName ?? sub.userPhone,
      businessName: null,
      currentPeriodEnd: sub.currentPeriodEnd!.toISOString(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    })),
  ]
    .sort((a, b) => a.currentPeriodEnd.localeCompare(b.currentPeriodEnd))
    .slice(0, UPCOMING_RENEWALS_LIMIT);

  return {
    generatedAt: now.toISOString(),
    ...aggregation,
    activeSubscriptions: {
      total: vipActive + placementActive,
      vip: vipActive,
      businessPlacement: placementActive,
    },
    pastDueSubscriptions: vipPastDue + placementPastDue,
    newSubscriptions30d: vipNew30 + placementNew30,
    newSubscriptionsPrev30d: vipNewPrev30 + placementNewPrev30,
    subscriptionsByStatus,
    upcomingRenewals,
  };
}

export const getFinanceDashboard = unstable_cache(
  async () => computeFinanceDashboard(),
  ['finance-dashboard'],
  { revalidate: 300, tags: ['finance-metrics'] },
);
