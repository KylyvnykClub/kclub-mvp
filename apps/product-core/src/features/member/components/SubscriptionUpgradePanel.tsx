import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Check, FileText, Minus } from 'lucide-react';

import type { CurrentMemberProfileDto } from '@kclub/contracts';

import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';
import { cabinetContentClasses, cabinetGridPanelClasses } from '@/features/member/components/cabinet/styles';
import { getOwnSubscriptions, getOwnInvoices, type InvoiceDto } from '@/server/services/subscription-service';
import { Button } from '@/components/ui/button';

import { UpgradeToVipButton } from './UpgradeToVipButton';

type SubscriptionUpgradePanelProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
};

export async function SubscriptionUpgradePanel({ locale, profile }: SubscriptionUpgradePanelProps) {
  const t = await getTranslations({ locale, namespace: 'member.dashboard.subscription' });

  const isVip = profile.membershipTier === 'VIP';

  const [subscriptions, invoices] = isVip
    ? await Promise.all([getOwnSubscriptions(profile.id), getOwnInvoices(profile.id)])
    : [[], [] as InvoiceDto[]];

  const activeSubscription = subscriptions.find(
    (subscription) => subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE',
  );
  const vipFeatures = [
    { label: t('vipFeature1'), included: true },
    { label: t('vipFeature2'), included: true },
    { label: t('vipFeature3'), included: true },
    { label: t('vipFeature4'), included: true },
    { label: t('vipFeature5'), included: false },
    { label: t('vipFeature6'), included: false },
  ];
  const businessFeatures = [
    { label: t('businessFeature1'), included: true },
    { label: t('businessFeature2'), included: true },
    { label: t('businessFeature3'), included: true },
    { label: t('businessFeature4'), included: true },
    { label: t('businessFeature5'), included: true },
    { label: t('businessFeature6'), included: true },
  ];

  return (
    <div className={cabinetContentClasses}>
      <div className="grid gap-0.5 lg:grid-cols-2">
        <div
          className={cn(
            cabinetGridPanelClasses,
            isVip && 'border-accent/25 border-t-2 border-t-accent bg-surface',
          )}
        >
          {isVip ? (
            <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">
              {t('currentPlanBadge')}
            </p>
          ) : (
            <div className="mb-4 h-6" />
          )}
          <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">VIP</p>
          <div className="mb-1 flex items-baseline gap-1">
            <span className="text-5xl font-bold leading-none text-foreground">$19</span>
            <span className="self-start pt-2 text-xl font-semibold text-foreground">.99</span>
            <span className="ml-1 text-sm text-muted-foreground">{t('vipPeriod')}</span>
          </div>
          <p className="mb-8 text-xs tracking-wide text-muted">{t('billingNote')}</p>
          <ul className="mb-9 space-y-3">
            {vipFeatures.map((feature) => (
              <li
                key={feature.label}
                className={cn(
                  'flex items-start gap-2.5 text-sm',
                  feature.included ? 'text-muted-foreground' : 'text-muted',
                )}
              >
                {feature.included ? (
                  <Check size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                ) : (
                  <Minus size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                )}
                {feature.label}
              </li>
            ))}
          </ul>
          {isVip ? (
            <Button type="button" variant="secondary" disabled className="w-full">
              {t('currentPlanCta')}
            </Button>
          ) : (
            <UpgradeToVipButton locale={locale} />
          )}
        </div>

        <div className={cn(cabinetGridPanelClasses)}>
          <div className="mb-4 h-6" />
          <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            Business
          </p>
          <p className="mb-2.5 text-2xl font-bold text-foreground">{t('businessPrice')}</p>
          <p className="mb-8 text-sm leading-relaxed text-muted">{t('businessPriceHint')}</p>
          <ul className="mb-9 space-y-3">
            {businessFeatures.map((feature) => (
              <li key={feature.label} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                {feature.label}
              </li>
            ))}
          </ul>
          <Link
            href={`/${locale}/m/business/onboarding`}
            className="inline-flex w-full items-center justify-center bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
          >
            {t('businessCta')}
          </Link>
        </div>
      </div>

      {!isVip ? (
        <p className="mt-6 text-center">
          <span className="text-xs tracking-wide text-muted">{t('continueFree')}</span>
        </p>
      ) : null}

      {isVip && invoices.length > 0 && (
        <div className="mt-10 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{t('paymentHistory')}</h3>
          <div className="divide-y divide-border border border-border">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {inv.number ?? inv.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inv.periodStart
                      ? new Date(inv.periodStart).toLocaleDateString(locale)
                      : new Date(inv.createdAt).toLocaleDateString(locale)}
                    {inv.periodEnd
                      ? ` — ${new Date(inv.periodEnd).toLocaleDateString(locale)}`
                      : null}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {(inv.amountPaid / 100).toLocaleString(locale, {
                      style: 'currency',
                      currency: inv.currency.toUpperCase(),
                    })}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      inv.status === 'paid' ? 'text-success' : 'text-muted-foreground',
                    )}
                  >
                    {inv.status === 'paid' ? t('invoiceStatusPaid') : (inv.status ?? '—')}
                  </span>
                  {inv.hostedInvoiceUrl && (
                    <a
                      href={inv.hostedInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-accent underline-offset-2 hover:underline"
                      aria-label={t('invoiceDownload')}
                    >
                      <FileText size={13} aria-hidden />
                      {t('invoiceDownload')}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
