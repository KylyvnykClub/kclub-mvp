import type { PublicBusinessDetailDto } from '@kclub/contracts';
import { Building2, CalendarDays, ExternalLink, MapPin, UserRound } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Badge, getButtonClasses } from '@kclub/ui';

import {
  getBusinessLocation,
  getPrimaryBusinessUrl,
  getSiteUrl,
} from '@/features/public/public-page-helpers';
import { Locale } from '@/i18n/routing';
import { AppError } from '@/server/errors';
import { getCachedPublicBusinessBySlug } from '@/server/cache/business-cache';

// Rendered dynamically (SSR): business profiles are created at runtime, so a
// slug not present at build time would otherwise be rendered on-demand as a
// cached/static page, and next-intl's request-locale access makes that throw
// DYNAMIC_SERVER_USAGE (a 500 for any business created after the last deploy).
export const dynamic = 'force-dynamic';

type Params = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'publicSeo.businessDetail' });
  const business = await getPublishedBusinessOrNull(slug);
  const siteUrl = getSiteUrl();

  if (!business) {
    return {
      title: t('notFoundTitle'),
      description: t('notFoundDescription'),
    };
  }

  const title = t('title', { name: business.name });
  const description = business.briefDescription ?? t('description', { name: business.name });
  const url = `${siteUrl}/${locale}/directory/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${siteUrl}/en/directory/${slug}`,
        ru: `${siteUrl}/ru/directory/${slug}`,
        uk: `${siteUrl}/uk/directory/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'KCLUB',
      type: 'article',
      ...(business.coverImageUrl
        ? { images: [{ url: business.coverImageUrl, alt: business.name }] }
        : {}),
    },
    twitter: {
      card: business.coverImageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
    },
  };
}

function buildBusinessJsonLd(business: PublicBusinessDetailDto, locale: Locale) {
  const siteUrl = getSiteUrl();
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    url: `${siteUrl}/${locale}/directory/${business.slug}`,
    ...(business.briefDescription ? { description: business.briefDescription } : {}),
    ...(business.logoUrl ? { image: business.logoUrl } : {}),
    ...(business.websiteUrl ? { sameAs: business.websiteUrl } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.cityName,
      addressCountry: business.countryName,
    },
    isPartOf: {
      '@type': 'Organization',
      name: 'KCLUB',
      url: siteUrl,
    },
  };
  return jsonLd;
}

export default async function BusinessDetailPage({ params }: Params) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'directory.detail' });
  const business = await getPublishedBusinessOrNull(slug);

  if (!business) {
    notFound();
  }

  const externalUrl = getPrimaryBusinessUrl(business);
  const jsonLd = buildBusinessJsonLd(business, locale);

  return (
    <article className="kclub-page-band">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="kclub-shell py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[480px_minmax(0,1fr)]">
          {/* Photo area */}
          <div className="relative aspect-square lg:aspect-auto lg:h-[500px] overflow-hidden rounded-3xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 flex items-center justify-center">
            {business.coverImageUrl || business.logoUrl ? (
              <img
                src={(business.coverImageUrl || business.logoUrl)!}
                alt={business.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Building2 className="text-zinc-300 dark:text-zinc-600" size={80} strokeWidth={1} />
            )}
          </div>

          {/* Details area */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{business.categoryName}</Badge>
              {business.featuredTop ? <Badge variant="success">{t('featuredTop')}</Badge> : null}
              {business.featuredRecommended ? (
                <Badge variant="success">{t('recommended')}</Badge>
              ) : null}
            </div>

            <h1
              data-testid="business-name"
              className="mt-5 max-w-4xl text-4xl font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white sm:text-6xl"
            >
              {business.name}
            </h1>

            {business.briefDescription ? (
              <p className="dark:text-white/68 mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600">
                {business.briefDescription}
              </p>
            ) : null}

            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-start lg:flex-col xl:flex-row">
              <aside className="kclub-panel flex-1 p-6 w-full">
                <dl className="space-y-5 text-sm">
                  <div className="flex gap-3">
                    <MapPin aria-hidden="true" size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                    <div>
                      <dt className="dark:text-white/52 text-zinc-500">{t('location')}</dt>
                      <dd className="mt-1 text-zinc-950 dark:text-white">
                        {getBusinessLocation(business)}
                      </dd>
                    </div>
                  </div>
                  {business.representativeName ? (
                    <div className="flex gap-3">
                      <UserRound aria-hidden="true" size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
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
                      <CalendarDays aria-hidden="true" size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                      <div>
                        <dt className="dark:text-white/52 text-zinc-500">{t('published')}</dt>
                        <dd className="mt-1 text-zinc-950 dark:text-white">
                          {new Intl.DateTimeFormat(locale).format(new Date(business.publishedAt))}
                        </dd>
                      </div>
                    </div>
                  ) : null}
                </dl>
              </aside>

              {externalUrl ? (
                <div className="w-full sm:w-auto lg:w-full xl:w-64 shrink-0">
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={getButtonClasses({
                      color: 'brand',
                      size: 'lg',
                      fullWidth: true,
                    })}
                  >
                    <ExternalLink aria-hidden="true" size={18} strokeWidth={1.5} />
                    {t('website')}
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {business.description ? (
          <div className="mt-16 xl:mt-24">
            <div className="kclub-panel p-8 sm:p-10">
              <h2 className="text-2xl font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white mb-6">
                {t('profileTitle')}
              </h2>
              <div className="dark:text-white/74 max-w-4xl whitespace-pre-wrap text-base leading-8 text-zinc-700">
                {business.description}
              </div>
            </div>
          </div>
        ) : null}
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
