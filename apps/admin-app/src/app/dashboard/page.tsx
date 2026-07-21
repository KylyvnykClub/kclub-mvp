import { fetchDashboardMetrics } from '@/features/dashboard/api';
import { DashboardErrorState } from '@/features/dashboard/components/dashboard-error-state';
import { OpsOverviewCard } from '@/features/dashboard/components/ops-overview-card';
import { RecentActivityCard } from '@/features/dashboard/components/recent-activity-card';
import { StatsGrid } from '@/features/dashboard/components/stats-grid';
import { TopCountriesCard } from '@/features/dashboard/components/top-countries-card';
import { Separator } from '@/components/ui/separator';

export default async function DashboardPage() {
  const metrics = await fetchDashboardMetrics();

  if (metrics.status !== 'success') {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">Pages / Overview</p>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        </div>
        <Separator />
        <DashboardErrorState
          code={metrics.status === 'unreachable' ? 'NETWORK_ERROR' : metrics.code}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">Pages / Overview</p>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      </div>
      <Separator />

      <StatsGrid data={metrics.data} />

      <TopCountriesCard data={metrics.data} />

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <RecentActivityCard items={metrics.data.recentActivity ?? []} />
        </div>
        <div className="xl:col-span-5">
          <OpsOverviewCard data={metrics.data} />
        </div>
      </div>
    </div>
  );
}
