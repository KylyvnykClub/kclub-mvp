import { PageShell } from '@/components/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TotalUsersCard,
  VipSubscriptionsCard,
  BusinessesUnderReviewCard,
  IntroductionsUnderReviewCard,
} from '@/features/dashboard/components/metrics-cards';
import { fetchDashboardMetrics } from '@/features/dashboard/api';

function MetricCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
    </div>
  );
}

export default async function DashboardPage() {
  const data = await fetchDashboardMetrics();

  return (
    <PageShell
      title="Dashboard"
      description="Cross-role metrics and operational overview."
      roleScope="All staff roles"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data ? (
          <>
            <TotalUsersCard data={data} />
            <VipSubscriptionsCard data={data} />
            <BusinessesUnderReviewCard count={data.businessesUnderReview} />
            <IntroductionsUnderReviewCard
              submitted={data.introductionsSubmitted}
              inReview={data.introductionsInReview}
            />
          </>
        ) : (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        )}
      </div>
    </PageShell>
  );
}
