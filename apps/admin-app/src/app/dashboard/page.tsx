import { PageShell } from '@/components/page-shell';
import { fetchDashboardMetrics, fetchFinanceDashboard } from '@/features/dashboard/api';
import { DashboardErrorState } from '@/features/dashboard/components/dashboard-error-state';
import { FinanceKpiGrid } from '@/features/dashboard/components/finance-kpi-cards';
import { FinanceUnavailableCard } from '@/features/dashboard/components/finance-unavailable-card';
import { OpsOverviewCard } from '@/features/dashboard/components/ops-overview-card';
import { RecentActivityCard } from '@/features/dashboard/components/recent-activity-card';
import { RecentPaymentsCard } from '@/features/dashboard/components/recent-payments-card';
import { RevenueBreakdownCard } from '@/features/dashboard/components/revenue-breakdown-card';
import { RevenueChartCard } from '@/features/dashboard/components/revenue-chart-card';
import { UpcomingRenewalsCard } from '@/features/dashboard/components/upcoming-renewals-card';
import { formatUpdatedAgo } from '@/features/dashboard/format';

export default async function DashboardPage() {
  const [metrics, finance] = await Promise.all([fetchDashboardMetrics(), fetchFinanceDashboard()]);

  if (metrics.status !== 'success' && finance.status !== 'success') {
    return (
      <PageShell
        title="Dashboard"
        description="Finance and operations overview."
        roleScope="All staff roles"
      >
        <DashboardErrorState
          code={metrics.status === 'unreachable' ? 'NETWORK_ERROR' : metrics.code}
        />
      </PageShell>
    );
  }

  const description =
    finance.status === 'success'
      ? `Finance and operations overview. ${formatUpdatedAgo(finance.data.generatedAt)}.`
      : 'Finance and operations overview.';

  return (
    <PageShell title="Dashboard" description={description} roleScope="All staff roles">
      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-12">
          {finance.status === 'success' ? (
            <>
              <div className="xl:col-span-6">
                <FinanceKpiGrid data={finance.data} />
              </div>
              <div className="xl:col-span-6">
                <RevenueBreakdownCard data={finance.data} />
              </div>
              <div className="xl:col-span-7">
                <RevenueChartCard
                  points={finance.data.monthlyRevenue}
                  currency={finance.data.currency}
                />
              </div>
              <div className="xl:col-span-5">
                <RecentPaymentsCard payments={finance.data.recentPayments} />
              </div>
            </>
          ) : (
            <FinanceUnavailableCard status={finance.status} className="xl:col-span-12" />
          )}
        </div>
        <div className="grid gap-4 xl:grid-cols-12">
          {finance.status === 'success' ? (
            <div className="xl:col-span-4">
              <UpcomingRenewalsCard renewals={finance.data.upcomingRenewals} />
            </div>
          ) : null}
          {metrics.status === 'success' ? (
            <>
              <div className={finance.status === 'success' ? 'xl:col-span-4' : 'xl:col-span-6'}>
                <RecentActivityCard items={metrics.data.recentActivity ?? []} />
              </div>
              <div className={finance.status === 'success' ? 'xl:col-span-4' : 'xl:col-span-6'}>
                <OpsOverviewCard data={metrics.data} />
              </div>
            </>
          ) : (
            <div className={finance.status === 'success' ? 'xl:col-span-8' : 'xl:col-span-12'}>
              <DashboardErrorState
                code={metrics.status === 'unreachable' ? 'NETWORK_ERROR' : metrics.code}
              />
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
