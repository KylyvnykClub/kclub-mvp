import { Skeleton } from '@/components/ui/skeleton';
import type { ReactNode } from 'react';

export function PageShellSkeleton({ children }: { children?: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="h-px bg-border" />
      {children}
    </div>
  );
}
