import { TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';

type StatCardProps = {
  label: string;
  value: number | string;
  detail?: string;
  delta?: number | null;
};

export function StatCard({ label, value, detail, delta }: StatCardProps) {
  const isPositive = delta != null && delta > 0;
  const isNegative = delta != null && delta < 0;
  const isNeutral = delta != null && delta === 0;

  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {detail && (
            <span className="text-sm text-muted-foreground">{detail}</span>
          )}
        </div>
        {delta != null && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
              isPositive && 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400',
              isNegative && 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
              isNeutral && 'bg-muted text-muted-foreground',
            )}
          >
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
