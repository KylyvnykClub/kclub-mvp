import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Tag,
  UserRound,
  Users,
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

  const title = business.seoTitle || t('title', { name: business.name });
  const description =
    business.seoDescription ||
    business.briefDescription ||
    t('description', { name: business.name });
  const url = `${siteUrl}/${locale}/directory/${encodeURIComponent(slug)}`;
  const ogImage = business.ogImageUrl || business.coverImageUrl;

  return {
    title,
    description,
    ...(business.seoKeywords ? { keywords: business.seoKeywords } : {}),
    alternates: {
      canonical: url,
      languages: {
        en: `${siteUrl}/en/directory/${encodeURIComponent(slug)}`,
        ru: `${siteUrl}/ru/directory/${encodeURIComponent(slug)}`,
        uk: `${siteUrl}/uk/directory/${encodeURIComponent(slug)}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'KCLUB',
      type: 'article',
      ...(ogImage ? { images: [{ url: ogImage, alt: business.name }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
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
    url: `${siteUrl}/${locale}/directory/${encodeURIComponent(business.slug)}`,
    ...(business.briefDescription ? { description: business.briefDescription } : {}),
    ...(business.logoUrl ? { image: business.logoUrl } : {}),
    ...(business.websiteUrl ? { sameAs: business.websiteUrl } : {}),
    ...(business.foundedYear ? { foundingDate: String(business.foundedYear) } : {}),
    ...(business.publicPhone ? { telephone: business.publicPhone } : {}),
    ...(business.publicEmail ? { email: business.publicEmail } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(business.address ? { streetAddress: business.address } : {}),
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
  const location = getBusinessLocation(business);
  const publishedLabel = business.publishedAt
    ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
        new Date(business.publishedAt),
      )
    : null;

  const categoryBreadcrumb = [business.blockName, business.categoryName, business.subcategoryName]
    .filter(Boolean)
    .join(' / ');

  const hasContact =
    business.publicPhone ||
    business.publicEmail ||
    business.websiteUrl ||
    business.socialUrl ||
    business.representativeName;

  return (
    <article className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back navigation */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
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
      </div>

      {/* Hero */}
      <header className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pb-14">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Cover / Logo area */}
          <div className="relative flex min-h-64 overflow-hidden border border-border bg-surface lg:col-span-5 lg:min-h-80">
            {business.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.coverImageUrl}
                alt={business.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex w-full items-center justify-center p-8">
                {business.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={business.logoUrl} alt="" className="max-h-32 max-w-64 object-contain" />
                ) : (
                  <div className="flex size-24 items-center justify-center border border-border text-muted-foreground">
                    <Building2 aria-hidden="true" className="size-10" strokeWidth={1} />
                  </div>
                )}
              </div>
            )}

            {/* Discount badge */}
            {business.memberDiscountPercent ? (
              <div className="bg-background/90 absolute right-4 top-4 border border-accent px-3 py-1.5 text-sm font-semibold text-accent backdrop-blur-sm">
                {business.discountMuted ? (
                  <span className="select-none opacity-80 blur-[4px]" aria-hidden="true">
                    %%
                  </span>
                ) : (
                  t('discountBadge', { percent: business.memberDiscountPercent })
                )}
              </div>
            ) : null}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-accent">
                <BadgeCheck aria-hidden="true" className="size-3.5" />
                {t('verifiedPartner')}
              </span>

              {business.featuredTop ? (
                <>
                  <span className="h-px w-4 bg-border" aria-hidden="true" />
                  <span className="text-xs font-medium uppercase tracking-widest text-accent">
                    {t('featuredTop')}
                  </span>
                </>
              ) : business.featuredRecommended ? (
                <>
                  <span className="h-px w-4 bg-border" aria-hidden="true" />
                  <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {t('recommended')}
                  </span>
                </>
              ) : null}
            </div>

            <p className="mt-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {categoryBreadcrumb}
            </p>

            <h1 className="mt-4 max-w-xl text-3xl font-light leading-tight tracking-tight text-foreground sm:text-4xl">
              {business.name}
            </h1>

            {business.briefDescription ? (
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {business.briefDescription}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
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
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin aria-hidden="true" className="size-4 text-accent" />
                {location}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          {/* About */}
          <div className="min-w-0 lg:col-span-8">
            <SectionHeading title={t('profileTitle')} />
            <div className="mt-6 whitespace-pre-wrap text-base leading-7 text-muted-foreground">
              {business.description || business.briefDescription || t('noDescription')}
            </div>

            {/* Member Benefit (inline, not buried in sidebar) */}
            {business.memberDiscountPercent ? (
              <div className="border-accent/30 mt-10 border bg-surface p-6 sm:p-8">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
                  <BadgeCheck aria-hidden="true" className="size-4" />
                  {t('memberBenefit')}
                </div>
                <div className="mt-4 flex items-baseline gap-3">
                  {business.discountMuted ? (
                    <span
                      className="select-none text-4xl font-light tracking-tight text-foreground opacity-50 blur-md"
                      aria-hidden="true"
                    >
                      %%
                    </span>
                  ) : (
                    <span className="text-4xl font-light tracking-tight text-foreground">
                      {business.memberDiscountPercent}%
                    </span>
                  )}
                  <span className="text-lg font-semibold text-foreground">{t('discount')}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t('discountDescription')}
                </p>
              </div>
            ) : null}
          </div>

          {/* Sidebar — single card with all details */}
          <aside className="min-w-0 lg:col-span-4">
            <div className="border border-border bg-surface p-6">
              <SectionHeading title={t('contactInfo')} small />

              <dl className="mt-5 space-y-4">
                {business.representativeName ? (
                  <ContactRow
                    icon={UserRound}
                    label={t('representative')}
                    value={business.representativeName}
                  />
                ) : null}

                {business.publicPhone ? (
                  <ContactRow icon={Phone} label={t('phone')}>
                    <a
                      href={`tel:${business.publicPhone}`}
                      className="text-sm text-foreground transition-colors hover:text-accent"
                    >
                      {business.publicPhone}
                    </a>
                  </ContactRow>
                ) : null}

                {business.publicEmail ? (
                  <ContactRow icon={Mail} label={t('email')}>
                    <a
                      href={`mailto:${business.publicEmail}`}
                      className="text-sm text-foreground transition-colors hover:text-accent"
                    >
                      {business.publicEmail}
                    </a>
                  </ContactRow>
                ) : null}

                {business.websiteUrl ? (
                  <ContactRow icon={Globe} label={t('website')}>
                    <a
                      href={business.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex max-w-full items-center gap-1.5 text-sm text-foreground transition-colors hover:text-accent"
                    >
                      <span className="truncate">
                        {business.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </a>
                  </ContactRow>
                ) : null}

                {business.socialUrl ? (
                  <ContactRow icon={ExternalLink} label={t('socialLink')}>
                    <a
                      href={business.socialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex max-w-full items-center gap-1.5 text-sm text-foreground transition-colors hover:text-accent"
                    >
                      <span className="truncate">
                        {business.socialUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </a>
                  </ContactRow>
                ) : null}

                {!hasContact ? (
                  <p className="text-sm text-muted-foreground">{t('contactViaConcierge')}</p>
                ) : null}
              </dl>

              {/* Location */}
              <div className="mt-6 border-t border-border pt-6">
                <ContactRow icon={MapPin} label={t('location')}>
                  <p className="text-sm font-medium text-foreground">{location}</p>
                  {business.address ? (
                    <p className="mt-1 text-sm text-muted-foreground">{business.address}</p>
                  ) : null}
                </ContactRow>
              </div>

              {/* Schedule */}
              {business.workingHours ? (
                <div className="mt-6 border-t border-border pt-6">
                  <ContactRow icon={Clock} label={t('workingHours')}>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {business.workingHours}
                    </p>
                  </ContactRow>
                </div>
              ) : null}

              {/* Member since */}
              {publishedLabel ? (
                <div className="mt-6 border-t border-border pt-6">
                  <ContactRow icon={Calendar} label={t('published')} value={publishedLabel} />
                </div>
              ) : null}

              {/* Category details */}
              <div className="mt-6 border-t border-border pt-6">
                <ContactRow icon={Tag} label={t('partnerDetails')} value={business.categoryName} />
              </div>

              {/* Founded year */}
              {business.foundedYear ? (
                <div className="mt-6 border-t border-border pt-6">
                  <ContactRow
                    icon={Calendar}
                    label={t('foundedYear')}
                    value={String(business.foundedYear)}
                  />
                </div>
              ) : null}

              {/* Team size */}
              {business.teamSize ? (
                <div className="mt-6 border-t border-border pt-6">
                  <ContactRow icon={Users} label={t('teamSize')} value={business.teamSize} />
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </article>
  );
}

/* ─── Sub-components ─── */

function SectionHeading({ title, small }: { title: string; small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-8 bg-accent" aria-hidden="true" />
      <h2
        className={
          small
            ? 'text-xs font-medium uppercase tracking-widest text-foreground'
            : 'text-sm font-medium uppercase tracking-widest text-foreground'
        }
      >
        {title}
      </h2>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof UserRound;
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </dt>
        {value ? <dd className="mt-1 text-sm text-foreground">{value}</dd> : null}
        {children ? <dd className="mt-1">{children}</dd> : null}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

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
