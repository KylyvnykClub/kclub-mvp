import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinanceUpcomingRenewalDto, SubscriptionKind } from '@kclub/contracts';

import { formatInDays, formatShortDate } from '../format';

const KIND_LABELS: Record<SubscriptionKind, string> = {
  VIP_MEMBERSHIP: 'VIP',
  BUSINESS_PLACEMENT: 'Business',
};

const KIND_BADGE_VARIANTS: Record<SubscriptionKind, 'secondary' | 'outline'> = {
  VIP_MEMBERSHIP: 'secondary',
  BUSINESS_PLACEMENT: 'outline',
};

export function UpcomingRenewalsCard({ renewals }: { renewals: FinanceUpcomingRenewalDto[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Upcoming Renewals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renewals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming renewals.</p>
        ) : (
          <ul className="divide-y">
            {renewals.map((renewal) => (
              <li key={renewal.subscriptionId} className="flex items-center gap-3 py-2">
                <Badge variant={KIND_BADGE_VARIANTS[renewal.kind]}>
                  {KIND_LABELS[renewal.kind]}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {renewal.businessName ?? renewal.userDisplayName ?? 'Unknown member'}
                  </p>
                  {renewal.cancelAtPeriodEnd ? (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Cancels at period end
                    </p>
                  ) : renewal.status === 'PAST_DUE' ? (
                    <p className="text-xs text-red-600 dark:text-red-400">Past due</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium">{formatInDays(renewal.currentPeriodEnd)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(renewal.currentPeriodEnd)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
