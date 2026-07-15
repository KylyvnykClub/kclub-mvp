import { ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FinanceRecentPaymentDto, SubscriptionKind } from '@kclub/contracts';

import { formatMoney, formatShortDate } from '../format';

const KIND_LABELS: Record<SubscriptionKind, string> = {
  VIP_MEMBERSHIP: 'VIP',
  BUSINESS_PLACEMENT: 'Business',
};

const KIND_BADGE_VARIANTS: Record<SubscriptionKind, 'secondary' | 'outline'> = {
  VIP_MEMBERSHIP: 'secondary',
  BUSINESS_PLACEMENT: 'outline',
};

export function RecentPaymentsCard({ payments }: { payments: FinanceRecentPaymentDto[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Recent Payments</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="max-w-[160px]">
                    <span className="block truncate" title={payment.customerName ?? undefined}>
                      {payment.customerName ?? payment.number ?? payment.id}
                    </span>
                  </TableCell>
                  <TableCell>
                    {payment.kind ? (
                      <Badge variant={KIND_BADGE_VARIANTS[payment.kind]}>
                        {KIND_LABELS[payment.kind]}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(payment.amountPaid, payment.currency)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      {formatShortDate(payment.createdAt)}
                      {payment.invoicePdf ? (
                        <a
                          href={payment.invoicePdf}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={`Open invoice ${payment.number ?? payment.id} PDF`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
