'use client';

import { AlertCircle, FileDown, ReceiptText } from 'lucide-react';

import type { AdminInvoiceDto } from '@kclub/contracts';
import { Button, EmptyState, Skeleton, getButtonClasses } from '@kclub/ui';

export type InvoiceLoadStatus = 'idle' | 'loading' | 'success' | 'error';

export function shouldLoadSubscriptionReceipts(
  activeTab: string,
  status: InvoiceLoadStatus,
): boolean {
  return activeTab === 'subscriptions' && status === 'idle';
}

type SubscriptionReceiptsProps = {
  invoices: AdminInvoiceDto[];
  status: InvoiceLoadStatus;
  error: string | null;
  onRetry: () => void;
};

export function SubscriptionReceipts({
  invoices,
  status,
  error,
  onRetry,
}: SubscriptionReceiptsProps) {
  return (
    <section className="mt-6 border-t border-border pt-6" aria-labelledby="payment-history-title">
      <div className="mb-4 space-y-1">
        <h3 id="payment-history-title" className="text-lg font-semibold text-foreground">
          Payment history
        </h3>
        <p className="text-sm text-muted-foreground">
          Paid VIP invoices synced directly from Stripe.
        </p>
      </div>

      {(status === 'idle' || status === 'loading') && (
        <div className="space-y-3" role="status" aria-label="Loading payment history">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {status === 'error' && (
        <EmptyState
          icon={<AlertCircle size={40} aria-hidden={true} />}
          title="Payment history unavailable"
          description={error ?? 'Could not load receipts from Stripe.'}
          action={
            <Button color="secondary" size="sm" type="button" onClick={onRetry}>
              Try again
            </Button>
          }
          className="rounded-md border border-border"
        />
      )}

      {status === 'success' && invoices.length === 0 && (
        <EmptyState
          icon={<ReceiptText size={40} aria-hidden={true} />}
          title="No paid receipts"
          description="Stripe has not produced a paid VIP invoice for this user yet."
          className="rounded-md border border-border"
        />
      )}

      {status === 'success' && invoices.length > 0 && (
        <div className="divide-y divide-border rounded-md border border-border">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {invoice.number ?? invoice.id}
                </p>
                <p className="text-xs text-muted-foreground">{formatInvoicePeriod(invoice)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatInvoiceAmount(invoice)} · {invoice.status ?? 'Unknown status'}
                </p>
              </div>

              {invoice.invoicePdf ? (
                <a
                  href={invoice.invoicePdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Download receipt ${invoice.number ?? invoice.id}`}
                  className={getButtonClasses({
                    color: 'secondary',
                    size: 'sm',
                    className: 'min-h-11 shrink-0 gap-2 self-start sm:self-auto',
                  })}
                >
                  <FileDown size={16} aria-hidden={true} />
                  Download receipt
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">PDF unavailable</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatInvoicePeriod(invoice: AdminInvoiceDto): string {
  const start = invoice.periodStart ?? invoice.createdAt;
  const startLabel = new Date(start).toLocaleDateString();

  if (!invoice.periodEnd) return startLabel;
  return `${startLabel} – ${new Date(invoice.periodEnd).toLocaleDateString()}`;
}

function formatInvoiceAmount(invoice: AdminInvoiceDto): string {
  return (invoice.amountPaid / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: invoice.currency.toUpperCase(),
  });
}
