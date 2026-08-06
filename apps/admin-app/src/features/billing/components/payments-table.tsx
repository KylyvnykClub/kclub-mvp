import { AdminPaymentDto } from '@kclub/contracts';
import { Badge, EmptyState, Surface } from '@kclub/ui';
import { CreditCard, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
  if (!payments || payments.length === 0) {
    return (
      <EmptyState
        icon={<CreditCard size={40} />}
        title="No payments"
        description="No incoming payments found."
      />
    );
  }

  return (
    <Surface className="overflow-x-auto p-0 sm:p-0">
      <table className="w-full text-left text-sm text-foreground">
        <thead className="bg-surface-muted border-b border-border text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-6 py-4 font-medium">Date</th>
            <th className="px-6 py-4 font-medium">Customer</th>
            <th className="px-6 py-4 font-medium">Description</th>
            <th className="px-6 py-4 font-medium">Amount</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium text-right">Receipt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {payments.map((payment) => (
            <tr key={payment.id} className="transition-colors hover:bg-surface-muted/50">
              <td className="whitespace-nowrap px-6 py-4">{formatDate(payment.created_at)}</td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  {payment.customer_name && <span className="font-medium">{payment.customer_name}</span>}
                  <span className="text-muted-foreground">{payment.customer_email || 'N/A'}</span>
                </div>
              </td>
              <td className="px-6 py-4">{payment.description || '-'}</td>
              <td className="whitespace-nowrap px-6 py-4 font-medium">
                {formatCurrency(payment.amount, payment.currency)}
              </td>
              <td className="px-6 py-4">
                <Badge
                  variant={payment.status === 'succeeded' ? 'success' : 'outline'}
                  className={payment.status === 'failed' ? 'text-destructive border-destructive' : ''}
                >
                  {payment.status}
                </Badge>
              </td>
              <td className="px-6 py-4 text-right">
                {payment.receipt_url ? (
                  <Link
                    href={payment.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    View <ExternalLink size={14} className="ml-1" />
                  </Link>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Surface>
  );
}
