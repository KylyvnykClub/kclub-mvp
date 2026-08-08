import type { PublicBusinessDetailDto } from '@kclub/contracts';
import {
  MapPin,
  Globe,
  Star,
  Share,
  BadgeCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';
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
    <article className="min-h-screen flex flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Hero Section */}
      <section className="relative w-full h-[442px] md:h-[530px] flex items-end">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-surface-muted"
          style={business.coverImageUrl ? { backgroundImage: `url('${business.coverImageUrl}')` } : undefined}
        >
          {!business.coverImageUrl && (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 className="size-32 text-muted-foreground opacity-20" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"></div>
        
        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 md:px-8 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-accent text-[13px] font-medium uppercase tracking-widest border border-accent/30 px-3 py-1">
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
          
          <h1 className="text-4xl md:text-6xl font-semibold text-accent mb-8 tracking-wide">
            {business.name}
          </h1>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            {externalUrl ? (
              <a 
                href={externalUrl} 
                target="_blank" 
                rel="noreferrer"
                className={getButtonClasses({ color: 'brand', size: 'lg' }) + ' uppercase tracking-widest font-bold !rounded-none'}
              >
                {t('website', { fallback: 'Contact Partner' })}
              </a>
            ) : null}
            
            <button className="bg-surface border border-accent/30 text-accent px-6 py-3.5 flex items-center gap-2 hover:bg-surface-muted hover:border-accent/60 transition-all active:scale-[0.98]">
              <Star className="size-5" />
              <span className="text-[13px] font-medium uppercase tracking-widest">{t('favorite', { fallback: 'Favorite' })}</span>
            </button>
            <button className="bg-surface border border-border text-muted-foreground px-4 py-3.5 flex items-center gap-2 hover:border-accent/30 hover:text-accent transition-all active:scale-[0.98]">
              <Share className="size-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Content Layout */}
      <section className="w-full max-w-[1280px] mx-auto px-6 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24">
          
          {/* Left Column: Details */}
          <div className="md:col-span-8 flex flex-col gap-16">
            
            {/* Special Condition Card (Club Privilege) */}
            {business.memberDiscountPercent ? (
              <div className="bg-surface border border-success/20 p-8 md:p-10 relative overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.05)] hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-success"></div>
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-success/5 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
                  <div className="p-4 bg-success/10 border border-success/20 shrink-0">
                    <BadgeCheck className="text-success size-7" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-medium text-success mb-3 uppercase tracking-widest">
                      {t('clubPrivilege', { fallback: 'Club Privilege' })}
                    </h3>
                    <p className="text-2xl font-semibold text-foreground mb-4">
                      {business.memberDiscountPercent}% {t('discount', { fallback: 'DISCOUNT ON PREMIUM SERVICES' })}
                    </p>
                    <p className="text-[15px] text-muted-foreground max-w-2xl leading-relaxed">
                      {t('discountDescription', { fallback: 'Present your digital membership card upon consultation to activate this exclusive benefit. Terms and conditions apply.' })}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* About Section */}
            {business.description || business.briefDescription ? (
              <div className="space-y-8">
                <h3 className="text-3xl font-semibold text-accent border-b border-border pb-6">
                  {t('profileTitle', { fallback: 'About the Partner' })}
                </h3>
                <div className="text-[16px] text-muted-foreground space-y-6 leading-relaxed whitespace-pre-wrap">
                  {business.description || business.briefDescription}
                </div>
              </div>
            ) : null}
          </div>
          
          {/* Right Column: Meta & Location */}
          <div className="md:col-span-4 flex flex-col gap-8">
            
            {/* Contact Info Card */}
            <div className="bg-surface border border-border p-8">
              <h4 className="text-lg font-semibold text-accent mb-6">
                {t('contactInfo', { fallback: 'Contact Information' })}
              </h4>
              <ul className="space-y-5">
                {business.websiteUrl ? (
                  <li className="flex items-center gap-4 group cursor-pointer">
                    <a href={business.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 w-full">
                      <div className="w-10 h-10 border border-border bg-background flex items-center justify-center group-hover:border-accent/50 transition-colors shrink-0">
                        <Globe className="size-5 text-muted-foreground group-hover:text-accent" />
                      </div>
                      <span className="text-[15px] text-foreground group-hover:text-accent/80 transition-colors truncate">
                        {business.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </span>
                    </a>
                  </li>
                ) : null}

                {business.socialUrl ? (
                  <li className="flex items-center gap-4 group cursor-pointer">
                    <a href={business.socialUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 w-full">
                      <div className="w-10 h-10 border border-border bg-background flex items-center justify-center group-hover:border-accent/50 transition-colors shrink-0">
                        <ExternalLink className="size-5 text-muted-foreground group-hover:text-accent" />
                      </div>
                      <span className="text-[15px] text-foreground group-hover:text-accent/80 transition-colors truncate">
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
            <div className="bg-surface border border-border overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border">
                <h4 className="text-lg font-semibold text-accent">
                  {t('headquarters', { fallback: 'Headquarters' })}
                </h4>
                <p className="text-[15px] text-muted-foreground mt-2">
                  {getBusinessLocation(business)}
                </p>
              </div>
              <div className="relative w-full h-56 bg-background flex items-center justify-center overflow-hidden">
                {/* Styled Map Background Placeholder */}
                <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity grayscale" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDzpvDrDI0Nuw_Yr3UcIL5I8291uiBFmG0T1AmYMPVlnMEnkL_XxPzeRzhFlS-PYrgS4B1N4paSQ4PWup-PNSzK3eZHFJ7xoLy9rbGHn_8yw8Kfzg9eP7Q5DDiurrzO6dHxSgbP-TdMJTh1nHWi9vpv01XD2amN3NG5PQPToaklDafp6rcqgLnnYqE_d_wcevPHPiKQ5or_sAcdMnKPqI-gBEGYYE75WnBulpc-JmjHhqVkFHkZYcTNAQ')" }}></div>
                
                {/* Map Marker */}
                <div className="relative z-10 p-2.5 bg-background border border-accent shadow-[0_0_20px_rgba(212,175,55,0.6)] flex items-center justify-center">
                  <MapPin className="size-7 text-accent" fill="currentColor" />
                </div>
                
                {/* Pulse Effect */}
                <div className="absolute z-0 w-16 h-16 bg-accent/20 animate-ping"></div>
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
