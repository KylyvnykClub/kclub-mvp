import { Skeleton } from '@/components/ui/skeleton';

function MetricCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
    </div>
  );
}

function ListCardSkeleton() {
  return (
    <div className="bg-card space-y-3 rounded-xl border p-4">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-2/3" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="h-px bg-border" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="bg-card rounded-xl border p-4 xl:col-span-7">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-[240px] w-full" />
        </div>
        <div className="xl:col-span-5">
          <ListCardSkeleton />
        </div>
      </div>
    </div>
  );
}
