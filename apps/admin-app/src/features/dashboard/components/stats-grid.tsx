import type { DashboardMetricsDto } from '@kclub/contracts';

import { StatCard } from './stat-card';
import { percentDelta } from '../format';

export function StatsGrid({ data }: { data: DashboardMetricsDto }) {
  const totalPending = data.introductionsSubmitted + data.introductionsInReview;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Users"
        value={data.totalUsers}
        detail={`${data.activeUsers} active`}
        delta={
          data.newUsers7d != null
            ? percentDelta(data.totalUsers, data.totalUsers - data.newUsers7d)
            : null
        }
      />
      <StatCard
        label="Active Subscriptions"
        value={data.activeSubscriptions}
        detail={data.pastDueSubscriptions > 0 ? `${data.pastDueSubscriptions} past due` : undefined}
      />
      <StatCard
        label="Businesses"
        value={data.totalBusinesses ?? 0}
        detail={
          <>
            {data.publishedBusinesses ?? 0} published
            {data.businessesUnderReview > 0 ? (
              <>
                {' '}
                ·{' '}
                <span className="font-medium text-yellow-700 dark:text-yellow-300">
                  {data.businessesUnderReview} under review
                </span>
              </>
            ) : (
              ` · 0 under review`
            )}
          </>
        }
        delta={
          data.newBusinesses7d != null && data.totalBusinesses
            ? percentDelta(data.totalBusinesses, data.totalBusinesses - data.newBusinesses7d)
            : null
        }
      />
      <StatCard
        label="Introductions"
        value={totalPending}
        detail={
          totalPending > 0 ? (
            <>
              {data.introductionsSubmitted} submitted
              {data.introductionsInReview > 0 ? (
                <>
                  {' '}
                  ·{' '}
                  <span className="font-medium text-yellow-700 dark:text-yellow-300">
                    {data.introductionsInReview} in review
                  </span>
                </>
              ) : (
                ` · 0 in review`
              )}
            </>
          ) : (
            'none pending'
          )
        }
      />
    </div>
  );
}
