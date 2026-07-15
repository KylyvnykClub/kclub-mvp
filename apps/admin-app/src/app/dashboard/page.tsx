import { PageShell } from '@/components/page-shell';
import { DashboardErrorState } from '@/features/dashboard/components/dashboard-error-state';
import {
  MetricCard,
  TotalUsersCard,
  TotalBusinessesCard,
  VipSubscriptionsCard,
  BusinessesUnderReviewCard,
  IntroductionsUnderReviewCard,
} from '@/features/dashboard/components/metrics-cards';
import { RecentActivityCard } from '@/features/dashboard/components/recent-activity-card';
import { fetchDashboardMetrics } from '@/features/dashboard/api';

export default async function DashboardPage() {
  const result = await fetchDashboardMetrics();

  return (
    <PageShell
      title="Dashboard"
      description="Cross-role metrics and operational overview."
      roleScope="All staff roles"
    >
      {result.status !== 'success' ? (
        <DashboardErrorState
          code={result.status === 'unreachable' ? 'NETWORK_ERROR' : result.code}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TotalUsersCard data={result.data} />
            <VipSubscriptionsCard data={result.data} />
            <BusinessesUnderReviewCard count={result.data.businessesUnderReview} />
            <IntroductionsUnderReviewCard
              submitted={result.data.introductionsSubmitted}
              inReview={result.data.introductionsInReview}
            />
            <TotalBusinessesCard
              total={result.data.totalBusinesses ?? 0}
              published={result.data.publishedBusinesses ?? 0}
            />
            <MetricCard label="New Users (7d)" value={String(result.data.newUsers7d ?? 0)} />
            <MetricCard
              label="New Businesses (7d)"
              value={String(result.data.newBusinesses7d ?? 0)}
            />
          </div>
          <RecentActivityCard items={result.data.recentActivity ?? []} />
        </div>
      )}
    </PageShell>
  );
}
