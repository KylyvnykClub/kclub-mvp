import { CalendarDays, ExternalLink, MapPin, UserRound } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Badge } from '@kclub/ui';

import { getBusinessLocation, getPrimaryBusinessUrl } from '@/features/public/public-page-helpers';
import { Locale } from '@/i18n/routing';
import { AppError } from '@/server/errors';
import { getCachedPublicBusinessBySlug } from '@/server/cache/business-cache';

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const { getPublicBusinesses } = await import('@/server/services/business-service');
    const businesses = await getPublicBusinesses();
    const locales = ['en', 'ru', 'uk'];
    return locales.flatMap((locale) => businesses.map((b) => ({ locale, slug: b.slug })));
  } catch {
    return [];
  }
}

type Params = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export async function generateMetadata({ params }: Params) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'publicSeo.businessDetail' });
  const business = await getPublishedBusinessOrNull(slug);

  if (!business) {
    return {
      title: t('notFoundTitle'),
      description: t('notFoundDescription'),
    };
  }

  return {
    title: t('title', { name: business.name }),
    description: business.briefDescription ?? t('description', { name: business.name }),
  };
}

export default async function BusinessDetailPage({ params }: Params) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'directory.detail' });
  const business = await getPublishedBusinessOrNull(slug);

  if (!business) {
    notFound();
  }

  const externalUrl = getPrimaryBusinessUrl(business);

  return (
    <article className="kclub-page-band">
      <div className="kclub-shell py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{business.categoryName}</Badge>
              {business.featuredTop ? <Badge variant="success">{t('featuredTop')}</Badge> : null}
              {business.featuredRecommended ? (
                <Badge variant="success">{t('recommended')}</Badge>
              ) : null}
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white sm:text-7xl">
              {business.name}
            </h1>

            {business.briefDescription ? (
              <p className="dark:text-white/68 mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
                {business.briefDescription}
              </p>
            ) : null}

            {business.description ? (
              <div className="dark:text-white/74 mt-12 max-w-3xl border-t border-zinc-200 pt-8 text-base leading-8 text-zinc-700 dark:border-white/10">
                {business.description}
              </div>
            ) : null}
          </div>

          <aside className="kclub-panel h-fit p-6">
            <h2 className="text-lg font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white">
              {t('profileTitle')}
            </h2>
            <dl className="mt-6 space-y-5 text-sm">
              <div className="flex gap-3">
                <MapPin aria-hidden="true" size={18} strokeWidth={1.5} className="mt-0.5" />
                <div>
                  <dt className="dark:text-white/52 text-zinc-500">{t('location')}</dt>
                  <dd className="mt-1 text-zinc-950 dark:text-white">
                    {getBusinessLocation(business)}
                  </dd>
                </div>
              </div>
              {business.representativeName ? (
                <div className="flex gap-3">
                  <UserRound aria-hidden="true" size={18} strokeWidth={1.5} className="mt-0.5" />
                  <div>
                    <dt className="dark:text-white/52 text-zinc-500">{t('representative')}</dt>
                    <dd className="mt-1 text-zinc-950 dark:text-white">
                      {business.representativeName}
                    </dd>
                  </div>
                </div>
              ) : null}
              {business.publishedAt ? (
                <div className="flex gap-3">
                  <CalendarDays aria-hidden="true" size={18} strokeWidth={1.5} className="mt-0.5" />
                  <div>
                    <dt className="dark:text-white/52 text-zinc-500">{t('published')}</dt>
                    <dd className="mt-1 text-zinc-950 dark:text-white">
                      {new Intl.DateTimeFormat(locale).format(new Date(business.publishedAt))}
                    </dd>
                  </div>
                </div>
              ) : null}
            </dl>

            {externalUrl ? (
              <a
                href={externalUrl}
                target="_blank"
                rel="noreferrer"
                className="kclub-button-primary mt-8 w-full rounded-none border-0 px-5 py-3 text-xs tracking-[0.24em]"
              >
                <ExternalLink aria-hidden="true" size={16} strokeWidth={1.5} />
                {t('website')}
              </a>
            ) : null}
          </aside>
        </div>
      </div>
    </article>
  );
}

async function getPublishedBusinessOrNull(slug: string) {
  try {
    return await getCachedPublicBusinessBySlug(slug);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
