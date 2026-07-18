import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import type { FinanceDashboardDto } from '@kclub/contracts';

import { FinanceKpiGrid } from '../../src/features/dashboard/components/finance-kpi-cards';
import { FinanceUnavailableCard } from '../../src/features/dashboard/components/finance-unavailable-card';
import { OpsOverviewCard } from '../../src/features/dashboard/components/ops-overview-card';
import { RecentPaymentsCard } from '../../src/features/dashboard/components/recent-payments-card';
import { RevenueBreakdownCard } from '../../src/features/dashboard/components/revenue-breakdown-card';
import { UpcomingRenewalsCard } from '../../src/features/dashboard/components/upcoming-renewals-card';
import { formatMoney, percentDelta } from '../../src/features/dashboard/format';

const FINANCE_FIXTURE: FinanceDashboardDto = {
  generatedAt: '2026-07-15T12:00:00.000Z',
  currency: 'usd',
  revenue30d: 125_000,
  revenuePrev30d: 100_000,
  activeSubscriptions: { total: 42, vip: 30, businessPlacement: 12 },
  pastDueSubscriptions: 3,
  newSubscriptions30d: 5,
  newSubscriptionsPrev30d: 0,
  revenueByKind: { vip: 800_000, businessPlacement: 400_000, other: 0 },
  subscriptionsByStatus: [
    { status: 'ACTIVE', count: 42 },
    { status: 'PAST_DUE', count: 3 },
  ],
  monthlyRevenue: [],
  recentPayments: [
    {
      id: 'in_1',
      number: 'KCLUB-0001',
      customerName: 'Olena K.',
      kind: 'VIP_MEMBERSHIP',
      amountPaid: 1_999,
      currency: 'usd',
      invoicePdf: 'https://pay.stripe.com/invoice/in_1/pdf',
      createdAt: '2026-07-10T00:00:00.000Z',
    },
  ],
  upcomingRenewals: [
    {
      subscriptionId: 'sub-row-1',
      kind: 'BUSINESS_PLACEMENT',
      status: 'ACTIVE',
      userDisplayName: 'Taras',
      businessName: 'Vulyk Coffee',
      currentPeriodEnd: '2027-01-01T00:00:00.000Z',
      cancelAtPeriodEnd: true,
    },
  ],
};

describe('finance dashboard components', () => {
  test('KPI grid renders money, split, and past-due attention state', () => {
    const markup = renderToStaticMarkup(<FinanceKpiGrid data={FINANCE_FIXTURE} />);

    expect(markup).toContain('$1,250.00');
    expect(markup).toContain('+25.0% vs prev 30d');
    expect(markup).toContain('30 VIP');
    expect(markup).toContain('Needs attention');
    expect(markup).toContain('vs prev 30d');
    expect(markup).not.toContain('NaN');
    expect(markup).not.toContain('Infinity');
  });

  test('revenue breakdown renders shares and status chips', () => {
    const markup = renderToStaticMarkup(<RevenueBreakdownCard data={FINANCE_FIXTURE} />);

    expect(markup).toContain('VIP Membership');
    expect(markup).toContain('$8,000.00');
    expect(markup).toContain('67%');
    expect(markup).toContain('$4,000.00');
    expect(markup).toContain('33%');
    expect(markup).not.toContain('Other');
    expect(markup).toContain('ACTIVE');
    expect(markup).toContain('PAST_DUE');
  });

  test('recent payments table renders customer, kind badge, amount, and PDF link', () => {
    const markup = renderToStaticMarkup(
      <RecentPaymentsCard payments={FINANCE_FIXTURE.recentPayments} />,
    );

    expect(markup).toContain('Olena K.');
    expect(markup).toContain('VIP');
    expect(markup).toContain('$19.99');
    expect(markup).toContain('https://pay.stripe.com/invoice/in_1/pdf');
  });

  test('upcoming renewals flag cancel-at-period-end and render empty state', () => {
    const markup = renderToStaticMarkup(
      <UpcomingRenewalsCard renewals={FINANCE_FIXTURE.upcomingRenewals} />,
    );
    expect(markup).toContain('Vulyk Coffee');
    expect(markup).toContain('Cancels at period end');

    const emptyMarkup = renderToStaticMarkup(<UpcomingRenewalsCard renewals={[]} />);
    expect(emptyMarkup).toContain('No upcoming renewals.');
  });

  test('ops overview links to admin pages and renders operational metrics', () => {
    const markup = renderToStaticMarkup(
      <OpsOverviewCard
        data={{
          totalUsers: 100,
          activeUsers: 95,
          blockedUsers: 5,
          activeSubscriptions: 30,
          pastDueSubscriptions: 1,
          expiredSubscriptions: 2,
          businessesUnderReview: 4,
          introductionsSubmitted: 2,
          introductionsInReview: 1,
          totalBusinesses: 12,
          publishedBusinesses: 8,
          newUsers7d: 6,
          newBusinesses7d: 3,
        }}
      />,
    );

    expect(markup).toContain('/dashboard/businesses');
    expect(markup).toContain('/dashboard/introductions');
    expect(markup).toContain('/dashboard/users');
    expect(markup).toContain('Registered users');
    expect(markup).toContain('95 active / 5 blocked');
    expect(markup).toContain('8 published / 3 new (7d)');
    expect(markup).toContain('2 submitted / 1 in review');
  });

  test('unavailable card explains forbidden and unavailable states', () => {
    expect(renderToStaticMarkup(<FinanceUnavailableCard status="forbidden" />)).toContain(
      'restricted',
    );
    expect(renderToStaticMarkup(<FinanceUnavailableCard status="unavailable" />)).toContain(
      'not available yet',
    );
  });
});

describe('finance format helpers', () => {
  test('formatMoney treats amounts as minor units', () => {
    expect(formatMoney(1_999, 'usd')).toBe('$19.99');
    expect(formatMoney(0, 'eur')).toContain('0.00');
  });

  test('percentDelta guards against a zero baseline', () => {
    expect(percentDelta(10, 0)).toBeNull();
    expect(percentDelta(120, 100)).toBeCloseTo(20);
    expect(percentDelta(80, 100)).toBeCloseTo(-20);
  });
});
