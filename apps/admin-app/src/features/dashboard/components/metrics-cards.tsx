import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardMetricsDto } from '@kclub/contracts';

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function TotalUsersCard({ data }: { data: DashboardMetricsDto }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold">{data.totalUsers}</p>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="text-green-600 dark:text-green-400">{data.activeUsers} active</span>
          <span className="text-red-600 dark:text-red-400">{data.blockedUsers} blocked</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function VipSubscriptionsCard({ data }: { data: DashboardMetricsDto }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          VIP Subscriptions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold">{data.activeSubscriptions}</p>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="text-green-600 dark:text-green-400">
            {data.activeSubscriptions} active
          </span>
          <span className="text-yellow-600 dark:text-yellow-400">
            {data.pastDueSubscriptions} past due
          </span>
          <span className="text-red-600 dark:text-red-400">
            {data.expiredSubscriptions} expired
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessesUnderReviewCard({ count }: { count: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Businesses Under Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{count}</p>
      </CardContent>
    </Card>
  );
}

export function IntroductionsUnderReviewCard({
  submitted,
  inReview,
}: {
  submitted: number;
  inReview: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Introductions Pending
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold">{submitted + inReview}</p>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{submitted} submitted</span>
          <span>{inReview} in review</span>
        </div>
      </CardContent>
    </Card>
  );
}
