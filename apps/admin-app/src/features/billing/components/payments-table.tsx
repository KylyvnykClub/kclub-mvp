import { AdminPaymentDto } from '@kclub/contracts';
import { Badge } from '@kclub/ui';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AdminList,
  AdminTableCard,
  AdminTableDesktop,
  AdminTableMobile,
} from '@/components/admin-list-layout';

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

export function PaymentsTable({ payments }: { payments: AdminPaymentDto[] }) {
  return (
    <AdminList>
      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!payments || payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No incoming payments found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(payment.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{payment.customer_name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{payment.customer_email || '—'}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.description || '—'}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={payment.status === 'succeeded' ? 'success' : 'outline'}
                        className={payment.status === 'failed' ? 'text-destructive border-destructive' : ''}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.receipt_url ? (
                        <Link
                          href={payment.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-primary hover:underline"
                        >
                          View <ExternalLink size={14} className="ml-1" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminTableDesktop>

        <AdminTableMobile>
          {!payments || payments.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No incoming payments found
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="space-y-3 p-4 border-b last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{payment.customer_name || 'N/A'}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {payment.customer_email || '—'}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={payment.status === 'succeeded' ? 'success' : 'outline'}
                    className={payment.status === 'failed' ? 'text-destructive border-destructive' : ''}
                  >
                    {payment.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">
                    {formatDate(payment.created_at)}
                  </div>
                  <div className="font-medium">
                    {formatCurrency(payment.amount, payment.currency)}
                  </div>
                </div>
                {payment.description && (
                  <div className="text-xs text-muted-foreground">
                    {payment.description}
                  </div>
                )}
                {payment.receipt_url && (
                  <div className="mt-2 flex justify-end border-t pt-3">
                    <Link
                      href={payment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary hover:underline"
                    >
                      View Receipt <ExternalLink size={14} className="ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </AdminTableMobile>
      </AdminTableCard>
    </AdminList>
  );
}
