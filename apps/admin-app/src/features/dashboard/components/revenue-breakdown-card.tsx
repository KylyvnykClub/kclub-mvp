import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinanceDashboardDto, SubscriptionStatus } from '@kclub/contracts';

import { formatMoney } from '../format';

const STATUS_BADGE_VARIANTS: Record<
  SubscriptionStatus,
  'success' | 'warning' | 'destructive' | 'secondary' | 'outline'
> = {
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'secondary',
  EXPIRED: 'destructive',
  NONE: 'outline',
};

function BreakdownRow({
  label,
  amount,
  total,
  currency,
  colorVar,
}: {
  label: string;
  amount: number;
  total: number;
  currency: string;
  colorVar: string;
}) {
  const share = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: `var(${colorVar})` }}
          />
          {label}
        </span>
        <span className="text-muted-foreground">
          {formatMoney(amount, currency)} · {share.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${share}%`, backgroundColor: `var(${colorVar})` }}
        />
      </div>
    </div>
  );
}

export function RevenueBreakdownCard({ data }: { data: FinanceDashboardDto }) {
  const { vip, businessPlacement, other } = data.revenueByKind;
  const total = vip + businessPlacement + other;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Revenue by Kind (12m)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">No revenue recorded yet.</p>
        ) : (
          <div className="space-y-3">
            <BreakdownRow
              label="VIP Membership"
              amount={vip}
              total={total}
              currency={data.currency}
              colorVar="--chart-1"
            />
            <BreakdownRow
              label="Business Placement"
              amount={businessPlacement}
              total={total}
              currency={data.currency}
              colorVar="--chart-2"
            />
            {other > 0 ? (
              <BreakdownRow
                label="Other"
                amount={other}
                total={total}
                currency={data.currency}
                colorVar="--chart-3"
              />
            ) : null}
          </div>
        )}
        {data.subscriptionsByStatus.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            {data.subscriptionsByStatus.map((entry) => (
              <span key={entry.status} className="inline-flex items-center gap-1.5">
                <Badge variant={STATUS_BADGE_VARIANTS[entry.status]}>{entry.status}</Badge>
                <span className="text-xs text-muted-foreground">{entry.count}</span>
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
