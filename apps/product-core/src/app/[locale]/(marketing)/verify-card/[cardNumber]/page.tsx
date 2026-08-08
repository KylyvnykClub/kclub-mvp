import { AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import { Badge, EmptyState } from '@kclub/ui';
import { parseWithValidation } from '@kclub/validation';

import { isPublicCardVerificationPiiSafe } from '@/features/public/public-page-helpers';
import { Locale } from '@/i18n/routing';
import { AppError } from '@/server/errors';
import { cardNumberSchema } from '@/server/services/card-helpers';
import { publicVerifyCard } from '@/server/services/card-service';

type Params = {
  params: Promise<{ locale: Locale; cardNumber: string }>;
};

export async function generateMetadata({ params }: Params) {
  const { locale, cardNumber } = await params;
  const t = await getTranslations({ locale, namespace: 'publicSeo.verifyCard' });

  return {
    title: t('title', { cardNumber }),
    description: t('description'),
  };
}

export default async function VerifyCardPage({ params }: Params) {
  const { locale, cardNumber } = await params;
  const t = await getTranslations({ locale, namespace: 'verifyCard' });
  const result = await getPublicCardOrNull(cardNumber);

  if (!result) {
    return (
      <div className="kclub-shell py-16 sm:py-20">
        <EmptyState
          icon={<AlertTriangle aria-hidden="true" size={44} strokeWidth={1.5} />}
          title={t('invalidTitle')}
          description={t('invalidDescription')}
        />
      </div>
    );
  }

  const statusIsActive = result.status === 'ACTIVE';

  return (
    <div className="kclub-shell py-16 sm:py-20">
      <section className="kclub-panel mx-auto max-w-3xl p-6 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.5)] sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="kclub-section-label">{t('eyebrow')}</p>
            <h1 className="mt-4 text-4xl font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white sm:text-5xl">
              {statusIsActive ? t('activeTitle') : t('inactiveTitle')}
            </h1>
            <p className="dark:text-white/66 mt-4 text-sm leading-7 text-zinc-600">
              {t('piiNotice')}
            </p>
          </div>
          <div className="text-zinc-900 dark:text-white">
            {statusIsActive ? (
              <CheckCircle2 aria-hidden="true" size={48} strokeWidth={1.5} />
            ) : (
              <CreditCard aria-hidden="true" size={48} strokeWidth={1.5} />
            )}
          </div>
        </div>

        <dl className="mt-10 grid gap-4 sm:grid-cols-2">
          <CardField label={t('cardNumber')} value={result.cardNumber} />
          <CardField label={t('tier')} value={result.membershipTier} />
          <CardField
            label={t('status')}
            value={<Badge variant={statusIsActive ? 'success' : 'outline'}>{result.status}</Badge>}
          />
          <CardField
            label={t('issuedAt')}
            value={new Intl.DateTimeFormat(locale).format(new Date(result.issuedAt))}
          />
          <CardField
            label={t('expiresAt')}
            value={
              result.expiresAt
                ? new Intl.DateTimeFormat(locale).format(new Date(result.expiresAt))
                : t('noExpiration')
            }
          />
        </dl>
      </section>
    </div>
  );
}

function CardField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="kclub-panel-soft p-4">
      <dt className="dark:text-white/48 text-xs uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </dt>
      <dd className="mt-2 text-sm text-zinc-950 dark:text-white">{value}</dd>
    </div>
  );
}

async function getPublicCardOrNull(cardNumber: string) {
  const parsed = parseWithValidation(cardNumberSchema, cardNumber);
  if (!parsed.success) {
    return null;
  }

  try {
    const card = await publicVerifyCard(parsed.data);
    return isPublicCardVerificationPiiSafe(card) ? card : null;
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
