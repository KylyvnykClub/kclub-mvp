import { getTranslations } from 'next-intl/server';

import type { PublicBusinessListItemDto } from '@kclub/contracts';
import { EmptyState } from '@kclub/ui';

import { getTopPartners } from '@/features/public/public-page-helpers';
import { Locale } from '@/i18n/routing';

import { MarketingBusinessCarousel } from './MarketingBusinessCarousel';

type TopPartnersSectionProps = {
  locale: Locale;
  businesses: PublicBusinessListItemDto[];
};

export async function TopPartnersSection({ locale, businesses }: TopPartnersSectionProps) {
  const partners = getTopPartners(businesses);
  const t = await getTranslations({ locale, namespace: 'home' });

  if (partners.length === 0) {
    return (
      <section className="kclub-border border-b bg-surface-muted py-16 dark:bg-surface-muted sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="kclub-border-strong border bg-white p-8 dark:bg-surface">
            <EmptyState
              description={t('partners.emptyDescription')}
              title={t('partners.emptyTitle')}
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="kclub-border border-b bg-surface-muted py-16 dark:bg-surface-muted sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <MarketingBusinessCarousel
          actionLabel={t('partners.viewSpecial')}
          businesses={partners}
          carouselLabels={{
            navigation: t('carousel.navigationLabel'),
            previous: t('carousel.previousLabel'),
            next: t('carousel.nextLabel'),
          }}
          header={
            <div className="max-w-2xl">
              <p className="border-l-4 border-accent pl-4 text-xs font-bold uppercase text-zinc-500 dark:text-white/60">
                {t('partners.eyebrow')}
              </p>
              <h2 className="mt-5 text-4xl font-black uppercase leading-tight text-zinc-950 dark:text-white sm:text-6xl">
                {t('partners.title')}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600 dark:text-muted-foreground">
                {t('partners.subtitle')}
              </p>
            </div>
          }
          locale={locale}
        />
      </div>
    </section>
  );
}
