import type { PublicBusinessDetailDto } from '@kclub/contracts';
import { MapPin, Globe, Star, Share, BadgeCheck, Building2, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { getButtonClasses } from '@kclub/ui';

import {
  getBusinessLocation,
  getPrimaryBusinessUrl,
  getSiteUrl,
} from '@/features/public/public-page-helpers';
import { Locale } from '@/i18n/routing';
import { AppError } from '@/server/errors';
import { getCachedPublicBusinessBySlug } from '@/server/cache/business-cache';

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
    <article className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative flex h-[442px] w-full items-end md:h-[530px]">
        <div
          className="absolute inset-0 bg-surface-muted bg-cover bg-center"
          style={
            business.coverImageUrl
              ? { backgroundImage: `url('${business.coverImageUrl}')` }
              : undefined
          }
        >
          {!business.coverImageUrl && (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 className="size-32 text-muted-foreground opacity-20" />
            </div>
          )}
        </div>
        <div className="via-background/70 absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>

        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 pb-12 md:px-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="border-accent/30 border px-3 py-1 text-[13px] font-medium uppercase tracking-widest text-accent">
              {business.categoryName}
            </span>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4" />
              <span className="text-[13px] font-medium uppercase tracking-widest">
                {getBusinessLocation(business)}
              </span>
            </div>
          </div>

          <h1 className="mb-8 text-4xl font-semibold tracking-wide text-accent md:text-6xl">
            {business.name}
          </h1>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            {externalUrl ? (
              <a
                href={externalUrl}
                target="_blank"
                rel="noreferrer"
                className={
                  getButtonClasses({ color: 'brand', size: 'lg' }) +
                  ' !rounded-none font-bold uppercase tracking-widest'
                }
              >
                {t('website', { fallback: 'Contact Partner' })}
              </a>
            ) : null}

            <button className="border-accent/30 hover:border-accent/60 flex items-center gap-2 border bg-surface px-6 py-3.5 text-accent transition-all hover:bg-surface-muted active:scale-[0.98]">
              <Star className="size-5" />
              <span className="text-[13px] font-medium uppercase tracking-widest">
                {t('favorite', { fallback: 'Favorite' })}
              </span>
            </button>
            <button className="hover:border-accent/30 flex items-center gap-2 border border-border bg-surface px-4 py-3.5 text-muted-foreground transition-all hover:text-accent active:scale-[0.98]">
              <Share className="size-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Content Layout */}
      <section className="mx-auto w-full max-w-[1280px] px-6 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 lg:gap-24">
          {/* Left Column: Details */}
          <div className="flex flex-col gap-16 md:col-span-8">
            {/* Special Condition Card (Club Privilege) */}
            {business.memberDiscountPercent ? (
              <div className="border-success/20 relative overflow-hidden border bg-surface p-8 shadow-[0_0_20px_rgba(34,197,94,0.05)] transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] md:p-10">
                <div className="absolute left-0 top-0 h-full w-1 bg-success"></div>
                <div className="bg-success/5 absolute -right-12 -top-12 h-48 w-48 blur-3xl"></div>

                <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row">
                  <div className="bg-success/10 border-success/20 shrink-0 border p-4">
                    <BadgeCheck className="size-7 text-success" />
                  </div>
                  <div>
                    <h3 className="mb-3 text-[13px] font-medium uppercase tracking-widest text-success">
                      {t('clubPrivilege', { fallback: 'Club Privilege' })}
                    </h3>
                    <p className="mb-4 text-2xl font-semibold text-foreground">
                      {business.memberDiscountPercent}%{' '}
                      {t('discount', { fallback: 'DISCOUNT ON PREMIUM SERVICES' })}
                    </p>
                    <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                      {t('discountDescription', {
                        fallback:
                          'Present your digital membership card upon consultation to activate this exclusive benefit. Terms and conditions apply.',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* About Section */}
            {business.description || business.briefDescription ? (
              <div className="space-y-8">
                <h3 className="border-b border-border pb-6 text-3xl font-semibold text-accent">
                  {t('profileTitle', { fallback: 'About the Partner' })}
                </h3>
                <div className="space-y-6 whitespace-pre-wrap text-[16px] leading-relaxed text-muted-foreground">
                  {business.description || business.briefDescription}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column: Meta & Location */}
          <div className="flex flex-col gap-8 md:col-span-4">
            {/* Contact Info Card */}
            <div className="border border-border bg-surface p-8">
              <h4 className="mb-6 text-lg font-semibold text-accent">
                {t('contactInfo', { fallback: 'Contact Information' })}
              </h4>
              <ul className="space-y-5">
                {business.websiteUrl ? (
                  <li className="group flex cursor-pointer items-center gap-4">
                    <a
                      href={business.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center gap-4"
                    >
                      <div className="group-hover:border-accent/50 flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background transition-colors">
                        <Globe className="size-5 text-muted-foreground group-hover:text-accent" />
                      </div>
                      <span className="group-hover:text-accent/80 truncate text-[15px] text-foreground transition-colors">
                        {business.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </span>
                    </a>
                  </li>
                ) : null}

                {business.socialUrl ? (
                  <li className="group flex cursor-pointer items-center gap-4">
                    <a
                      href={business.socialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center gap-4"
                    >
                      <div className="group-hover:border-accent/50 flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background transition-colors">
                        <ExternalLink className="size-5 text-muted-foreground group-hover:text-accent" />
                      </div>
                      <span className="group-hover:text-accent/80 truncate text-[15px] text-foreground transition-colors">
                        {business.socialUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </span>
                    </a>
                  </li>
                ) : null}

                {!business.websiteUrl && !business.socialUrl && (
                  <li className="flex items-center gap-4">
                    <span className="text-[15px] text-muted-foreground">
                      {t('contactViaConcierge', { fallback: 'Contact concierge for details.' })}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Location Map Card */}
            <div className="flex flex-col overflow-hidden border border-border bg-surface">
              <div className="border-b border-border p-6">
                <h4 className="text-lg font-semibold text-accent">
                  {t('headquarters', { fallback: 'Headquarters' })}
                </h4>
                <p className="mt-2 text-[15px] text-muted-foreground">
                  {getBusinessLocation(business)}
                </p>
              </div>
              <div className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-background">
                {/* Styled Map Background Placeholder */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity grayscale"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDzpvDrDI0Nuw_Yr3UcIL5I8291uiBFmG0T1AmYMPVlnMEnkL_XxPzeRzhFlS-PYrgS4B1N4paSQ4PWup-PNSzK3eZHFJ7xoLy9rbGHn_8yw8Kfzg9eP7Q5DDiurrzO6dHxSgbP-TdMJTh1nHWi9vpv01XD2amN3NG5PQPToaklDafp6rcqgLnnYqE_d_wcevPHPiKQ5or_sAcdMnKPqI-gBEGYYE75WnBulpc-JmjHhqVkFHkZYcTNAQ')",
                  }}
                ></div>

                {/* Map Marker */}
                <div className="relative z-10 flex items-center justify-center border border-accent bg-background p-2.5 shadow-[0_0_20px_rgba(212,175,55,0.6)]">
                  <MapPin className="size-7 text-accent" fill="currentColor" />
                </div>

                {/* Pulse Effect */}
                <div className="bg-accent/20 absolute z-0 h-16 w-16 animate-ping"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
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
