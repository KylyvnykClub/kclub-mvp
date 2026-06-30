import { PageShellSkeleton } from '@/components/page-shell-skeleton';
import { TableSkeleton } from '@/components/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageShellSkeleton>
      <div className="space-y-6">
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    </PageShellSkeleton>
  );
}
