import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinanceDashboardDto, StaffRole } from '@kclub/contracts';
import { cn } from '@/lib/utils';
import { formatMoney } from '../format';

function MetricRow({
  label,
  transactions,
  revenue,
  currency,
  blur,
}: {
  label: string;
  transactions: number;
  revenue: number;
  currency: string;
  blur: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-right">
        <div
          className={cn(
            'text-sm font-semibold tracking-tight',
            blur && 'select-none blur-sm transition-all hover:blur-none',
          )}
        >
          {formatMoney(revenue, currency)}
        </div>
        <div
          className={cn(
            'text-xs text-muted-foreground',
            blur && 'select-none blur-sm transition-all hover:blur-none',
          )}
        >
          {transactions} transaction{transactions !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

export function FinanceTransactionsCard({
  data,
  staffRole,
}: {
  data: FinanceDashboardDto;
  staffRole: StaffRole;
}) {
  const { vip, businessPlacement, other } = data.revenueByKind;
  const { vip: vipT, businessPlacement: bpT, other: otherT } = data.transactionsByKind;
  const totalRev = vip + businessPlacement + other;
  const totalT = vipT + bpT + otherT;
  const blur = staffRole !== 'OWNER';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
          <span>Transactions & Revenue (All-time)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="rounded-lg bg-muted/50 p-4 flex flex-col gap-1">
          <div className="text-sm font-medium text-muted-foreground">Total</div>
          <div
            className={cn(
              'text-2xl font-bold tracking-tight',
              blur && 'select-none blur-sm transition-all hover:blur-none',
            )}
          >
            {formatMoney(totalRev, data.currency)}
          </div>
          <div
            className={cn(
              'text-sm text-muted-foreground',
              blur && 'select-none blur-sm transition-all hover:blur-none',
            )}
          >
            {totalT} transaction{totalT !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <MetricRow
            label="Members (VIP)"
            transactions={vipT}
            revenue={vip}
            currency={data.currency}
            blur={blur}
          />
          <MetricRow
            label="Business"
            transactions={bpT}
            revenue={businessPlacement}
            currency={data.currency}
            blur={blur}
          />
          {otherT > 0 && (
            <MetricRow
              label="Other"
              transactions={otherT}
              revenue={other}
              currency={data.currency}
              blur={blur}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
