import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  ExternalLink,
  Globe,
  MapPin,
  UserRound,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import type { PublicBusinessDetailDto } from '@kclub/contracts';
import { getButtonClasses } from '@kclub/ui';

import {
  getBusinessLocation,
  getPrimaryBusinessUrl,
  getSiteUrl,
} from '@/features/public/public-page-helpers';
import { Locale } from '@/i18n/routing';
import { getCachedPublicBusinessBySlug } from '@/server/cache/business-cache';
import { AppError } from '@/server/errors';

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
  const publishedLabel = business.publishedAt
    ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
        new Date(business.publishedAt),
      )
    : null;

  return (
    <article className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <Link
            href={`/${locale}/directory`}
            className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform group-hover:-translate-x-1"
            />
            {t('backToDirectory')}
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-12">
            <div className="flex flex-col justify-between lg:col-span-7 lg:py-6">
              <div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs font-medium uppercase tracking-widest">
                  <span className="inline-flex items-center gap-2 text-accent">
                    <BadgeCheck aria-hidden="true" className="size-4" />
                    {t('verifiedPartner')}
                  </span>
                  <span className="h-px w-8 bg-border" aria-hidden="true" />
                  <span className="text-muted-foreground">{business.categoryName}</span>
                </div>

                <h1 className="mt-8 max-w-4xl text-3xl font-light leading-tight tracking-tight text-foreground sm:text-4xl">
                  {business.name}
                </h1>

                {business.briefDescription ? (
                  <p className="mt-6 max-w-3xl text-base leading-7 text-muted-foreground">
                    {business.briefDescription}
                  </p>
                ) : null}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                {externalUrl ? (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={getButtonClasses({ color: 'brand', size: 'lg' })}
                  >
                    {t('website')}
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </a>
                ) : null}
                <span className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
                  <MapPin aria-hidden="true" className="size-4 text-accent" />
                  {getBusinessLocation(business)}
                </span>
              </div>
            </div>

            <div className="relative flex min-h-80 overflow-hidden border border-border bg-surface lg:col-span-5">
              {business.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.coverImageUrl}
                  alt={business.name}
                  className="absolute inset-0 h-full w-full object-cover grayscale"
                />
              ) : (
                <div className="flex w-full flex-col justify-between p-8 sm:p-10">
                  <div className="flex items-center justify-between border-b border-border pb-5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    <span>KCLUB</span>
                    <span>{business.categoryName}</span>
                  </div>
                  <div className="flex flex-1 items-center justify-center py-12">
                    {business.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={business.logoUrl}
                        alt=""
                        className="max-h-32 max-w-64 object-contain"
                      />
                    ) : (
                      <div className="flex size-24 items-center justify-center border border-accent text-accent">
                        <Building2 aria-hidden="true" className="size-10" strokeWidth={1.25} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-5 text-xs font-medium uppercase tracking-widest">
                    <span className="text-accent">{t('verifiedPartner')}</span>
                    <span className="text-muted-foreground">{getBusinessLocation(business)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="min-w-0 space-y-14 lg:col-span-8">
            {business.description || business.briefDescription ? (
              <section aria-labelledby="partner-profile-title">
                <div className="flex items-center gap-4 border-b border-border pb-5">
                  <span className="h-px w-10 bg-accent" aria-hidden="true" />
                  <h2
                    id="partner-profile-title"
                    className="text-sm font-medium uppercase tracking-widest text-foreground"
                  >
                    {t('profileTitle')}
                  </h2>
                </div>
                <p className="mt-8 whitespace-pre-wrap text-base leading-7 text-muted-foreground">
                  {business.description || business.briefDescription}
                </p>
              </section>
            ) : null}

            <section aria-labelledby="partner-details-title">
              <div className="flex items-center gap-4 border-b border-border pb-5">
                <span className="h-px w-10 bg-accent" aria-hidden="true" />
                <h2
                  id="partner-details-title"
                  className="text-sm font-medium uppercase tracking-widest text-foreground"
                >
                  {t('partnerDetails')}
                </h2>
              </div>

              <dl className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="flex gap-4 py-7 sm:pr-8">
                  <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      {t('location')}
                    </dt>
                    <dd className="mt-2 text-sm text-foreground">
                      {getBusinessLocation(business)}
                    </dd>
                  </div>
                </div>

                {business.representativeName ? (
                  <div className="flex gap-4 py-7 sm:pl-8">
                    <UserRound aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        {t('representative')}
                      </dt>
                      <dd className="mt-2 text-sm text-foreground">
                        {business.representativeName}
                      </dd>
                    </div>
                  </div>
                ) : publishedLabel ? (
                  <div className="flex gap-4 py-7 sm:pl-8">
                    <CalendarDays aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        {t('published')}
                      </dt>
                      <dd className="mt-2 text-sm capitalize text-foreground">{publishedLabel}</dd>
                    </div>
                  </div>
                ) : null}
              </dl>
            </section>
          </div>

          <aside className="min-w-0 space-y-6 lg:col-span-4">
            {business.memberDiscountPercent ? (
              <section className="border border-accent bg-surface p-7 sm:p-8">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
                  <BadgeCheck aria-hidden="true" className="size-4" />
                  {t('memberBenefit')}
                </div>
                <p className="mt-8 text-5xl font-light tracking-tight text-foreground">
                  {business.memberDiscountPercent}%
                </p>
                <h2 className="mt-4 text-lg font-semibold leading-7 text-foreground">
                  {t('discount')}
                </h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {t('discountDescription')}
                </p>
              </section>
            ) : null}

            <section className="border border-border bg-surface p-7 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {t('contactInfo')}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">{t('onlinePresence')}</h2>

              <ul className="mt-6 divide-y divide-border border-y border-border">
                {business.websiteUrl ? (
                  <li>
                    <a
                      href={business.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex min-h-14 items-center gap-3 py-3 text-sm text-foreground outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Globe aria-hidden="true" className="size-5 shrink-0 text-accent" />
                      <span className="min-w-0 flex-1 truncate">
                        {business.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                      />
                    </a>
                  </li>
                ) : null}

                {business.socialUrl ? (
                  <li>
                    <a
                      href={business.socialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex min-h-14 items-center gap-3 py-3 text-sm text-foreground outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ExternalLink aria-hidden="true" className="size-5 shrink-0 text-accent" />
                      <span className="min-w-0 flex-1 truncate">
                        {business.socialUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                      />
                    </a>
                  </li>
                ) : null}

                {!business.websiteUrl && !business.socialUrl ? (
                  <li className="py-5 text-sm leading-6 text-muted-foreground">
                    {t('contactViaConcierge')}
                  </li>
                ) : null}
              </ul>

              <div className="mt-7 flex items-start gap-3">
                <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {t('headquarters')}
                  </p>
                  <p className="mt-2 text-sm text-foreground">{getBusinessLocation(business)}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </article>
  );
}

async function getPublishedBusinessOrNull(slug: string) {
  try {
    return await getCachedPublicBusinessBySlug(normalizeBusinessSlug(slug));
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

function normalizeBusinessSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).normalize('NFC');
  } catch {
    return slug.normalize('NFC');
  }
}
