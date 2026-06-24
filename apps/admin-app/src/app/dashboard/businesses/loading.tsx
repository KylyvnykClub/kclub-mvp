import { PageShellSkeleton } from '@/components/page-shell-skeleton';
import { TableSkeleton } from '@/components/table-skeleton';

export default function Loading() {
  return (
    <PageShellSkeleton>
      <TableSkeleton />
    </PageShellSkeleton>
  );
}
