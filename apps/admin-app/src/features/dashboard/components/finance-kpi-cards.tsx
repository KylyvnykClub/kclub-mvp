import { TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FinanceDashboardDto } from '@kclub/contracts';

import { formatMoney, percentDelta } from '../format';

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const delta = percentDelta(current, previous);
  if (delta === null) {
    return <span className="text-xs text-muted-foreground">— vs prev 30d</span>;
  }
  const isUp = delta >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      )}
    >
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isUp ? '+' : ''}
      {delta.toFixed(1)}% vs prev 30d
    </span>
  );
}

function KpiCard({
  label,
  value,
  footer,
}: {
  label: string;
  value: string;
  footer: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold">{value}</p>
        <div className="text-xs text-muted-foreground">{footer}</div>
      </CardContent>
    </Card>
  );
}

export function FinanceKpiGrid({ data }: { data: FinanceDashboardDto }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <KpiCard
        label="Revenue (30d)"
        value={formatMoney(data.revenue30d, data.currency)}
        footer={<DeltaBadge current={data.revenue30d} previous={data.revenuePrev30d} />}
      />
      <KpiCard
        label="Active Subscriptions"
        value={String(data.activeSubscriptions.total)}
        footer={
          <span>
            {data.activeSubscriptions.vip} VIP · {data.activeSubscriptions.businessPlacement}{' '}
            Business
          </span>
        }
      />
      <KpiCard
        label="Past Due"
        value={String(data.pastDueSubscriptions)}
        footer={
          data.pastDueSubscriptions > 0 ? (
            <span className="text-yellow-600 dark:text-yellow-400">Needs attention</span>
          ) : (
            <span>All subscriptions current</span>
          )
        }
      />
      <KpiCard
        label="New Subscriptions (30d)"
        value={String(data.newSubscriptions30d)}
        footer={
          <DeltaBadge current={data.newSubscriptions30d} previous={data.newSubscriptionsPrev30d} />
        }
      />
    </div>
  );
}
