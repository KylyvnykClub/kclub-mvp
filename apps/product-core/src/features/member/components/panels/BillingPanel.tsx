'use client';

import { useTranslations } from 'next-intl';

import type { CurrentMemberProfileDto, MemberBusinessProfileDto } from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import { Badge } from '@/components/reui/badge';

type BillingPanelProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  business: MemberBusinessProfileDto | null;
};

export function BillingPanel({ locale, profile, business }: BillingPanelProps) {
  const t = useTranslations('member.dashboard.billing');
  const planLabel = profile.membershipTier === 'VIP' ? 'VIP Partner — Annual' : 'Member — Free';

  return (
    <div className="flex flex-col gap-6">
      {/* Current plan */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface-muted p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="outline" className="uppercase">
              {planLabel}
            </Badge>
            <p className="mt-2.5 text-sm text-muted-foreground">
              {t('renewalInfo')}
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface-muted"
            >
              {t('changePlan')}
            </button>
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('cancelRenewal')}
            </button>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="rounded-xl border border-border bg-surface-muted p-6">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t('paymentMethod')}</h3>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-[30px] w-11 items-center justify-center rounded-md border border-border bg-surface font-mono text-[10px] text-muted-foreground">
              VISA
            </div>
            <span className="text-sm text-foreground">•••• •••• •••• 4471</span>
          </div>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-muted"
          >
            {t('update')}
          </button>
        </div>
      </div>

      {/* Invoices */}
      <div className="rounded-xl border border-border bg-surface-muted p-6">
        <h3 className="mb-2 text-sm font-semibold text-foreground">{t('invoices')}</h3>
        <div className="flex flex-col">
          <div className="grid grid-cols-[1fr_1fr_1fr_0.6fr] gap-2 border-b border-border py-2 text-[11px] uppercase tracking-[0.12em] text-muted">
            <span>{t('invoiceId')}</span>
            <span>{t('date')}</span>
            <span>{t('amount')}</span>
            <span>{t('status')}</span>
          </div>
          <p className="py-4 text-sm text-muted-foreground">{t('noInvoices')}</p>
        </div>
      </div>
    </div>
  );
}
