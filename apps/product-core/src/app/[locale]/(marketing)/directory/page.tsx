import { ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { EmptyState } from '@kclub/ui';

import { BusinessCard } from '@/features/public/components/BusinessCard';
import { getFeaturedBusinessGroups } from '@/features/public/public-page-helpers';
import { Locale } from '@/i18n/routing';
import { getCachedPublicBusinesses } from '@/server/cache/business-cache';

export const revalidate = 60;

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ru' }, { locale: 'uk' }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'publicSeo.directory' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function DirectoryPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'directory' });
  const businesses = await getCachedPublicBusinesses();
  const { top, recommended } = getFeaturedBusinessGroups(businesses);

  return (
    <div className="kclub-page-band">
      <section className="kclub-page-band bg-white dark:bg-[#09090b]">
        <div className="kclub-shell py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <p className="kclub-section-label">{t('eyebrow')}</p>
              <h1 className="mt-5 max-w-5xl text-5xl font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white sm:text-7xl">
                {t('title')}
              </h1>
              <p className="dark:text-white/68 mt-6 max-w-2xl text-base leading-8 text-zinc-600">
                {t('description')}
              </p>
            </div>
            <div className="kclub-panel p-6">
              <p className="kclub-note">{t('publishedOnly')}</p>
              <p className="mt-3 text-4xl font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white">
                {businesses.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="kclub-shell py-14 sm:py-20">
        {businesses.length === 0 ? (
          <EmptyState
            icon={<Building2 aria-hidden="true" size={44} strokeWidth={1.5} />}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            action={
              <Link
                href={`/${locale}/sign-up`}
                className="kclub-button-primary rounded-none border-0 px-5 py-3 text-xs tracking-[0.24em]"
              >
                {t('emptyAction')}
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.7} />
              </Link>
            }
          />
        ) : (
          <div className="space-y-14">
            {top.length > 0 ? (
              <DirectorySection
                title={t('featuredTopTitle')}
                businesses={top}
                locale={locale}
                actionLabel={t('viewDetails')}
                externalLabel={t('website')}
                featuredLabel={t('featuredTopLabel')}
              />
            ) : null}

            {recommended.length > 0 ? (
              <DirectorySection
                title={t('recommendedTitle')}
                businesses={recommended}
                locale={locale}
                actionLabel={t('viewDetails')}
                externalLabel={t('website')}
                featuredLabel={t('recommendedLabel')}
              />
            ) : null}

            <DirectorySection
              title={t('allTitle')}
              businesses={businesses}
              locale={locale}
              actionLabel={t('viewDetails')}
              externalLabel={t('website')}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DirectorySection({
  title,
  businesses,
  locale,
  actionLabel,
  externalLabel,
  featuredLabel,
}: {
  title: string;
  businesses: Awaited<ReturnType<typeof getCachedPublicBusinesses>>;
  locale: Locale;
  actionLabel: string;
  externalLabel: string;
  featuredLabel?: string;
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="kclub-card-grid mt-6">
        {businesses.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            href={`/${locale}/directory/${business.slug}`}
            actionLabel={actionLabel}
            externalLabel={externalLabel}
            featuredLabel={featuredLabel}
          />
        ))}
      </div>
    </section>
  );
}
