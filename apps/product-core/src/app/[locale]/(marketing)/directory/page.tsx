import { ArrowRight, Building2, Search, Mic } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import type { CategoryDto } from '@kclub/contracts';
import { EmptyState, getButtonClasses } from '@kclub/ui';

import { BusinessCard } from '@/features/public/components/BusinessCard';
import { getSiteUrl } from '@/features/public/public-page-helpers';
import { Locale } from '@/i18n/routing';
import { getCachedPublicBusinesses } from '@/server/cache/business-cache';
import { getCachedCategories } from '@/server/cache/taxonomy-cache';
import { DirectoryTaxonomyFilter, type CategoryBranch } from './directory-taxonomy-filter';

export const revalidate = 60;

type DirectorySearchParams = {
  sphere?: string;
  block?: string;
  category?: string;
  activity?: string;
  subcategory?: string;
};


export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ru' }, { locale: 'uk' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'publicSeo.directory' });
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/${locale}/directory`;

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: url,
      languages: {
        en: `${siteUrl}/en/directory`,
        ru: `${siteUrl}/ru/directory`,
        uk: `${siteUrl}/uk/directory`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url,
      siteName: 'KCLUB',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: t('title'),
      description: t('description'),
    },
  };
}

function buildDirectoryJsonLd(
  businesses: Array<{ name: string; slug: string; briefDescription: string | null }>,
  locale: Locale,
) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'KCLUB Partner Directory',
    url: `${siteUrl}/${locale}/directory`,
    numberOfItems: businesses.length,
    itemListElement: businesses.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${siteUrl}/${locale}/directory/${b.slug}`,
      name: b.name,
      ...(b.briefDescription ? { description: b.briefDescription } : {}),
    })),
  };
}

export default async function DirectoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<DirectorySearchParams>;
}) {
  const { locale } = await params;
  const {
    sphere,
    block: activeBlock,
    category: activeCategory,
    activity,
    subcategory: activeSubcategory,
  } = await searchParams;

  const t = await getTranslations({ locale, namespace: 'directory' });
  const [allBusinesses, categories] = await Promise.all([
    getCachedPublicBusinesses(),
    getCachedCategories(),
  ]);

  const categoryTree = buildCategoryTree(categories);
  const activeSelection = resolveActiveSelection(categoryTree, {
    sphere: sphere ?? activeBlock,
    category: activeCategory,
    activity: activity ?? activeSubcategory,
  });

  const businesses = allBusinesses.filter((business) => {
    if (activeSelection.activity) return business.subcategorySlug === activeSelection.activity;
    if (activeSelection.category) return business.categorySlug === activeSelection.category;
    if (activeSelection.sphere) return business.blockSlug === activeSelection.sphere;
    return true;
  });

  const jsonLd = buildDirectoryJsonLd(allBusinesses, locale);

  return (
    <div className="kclub-page-band">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="kclub-page-band bg-white dark:bg-[#09090b]">
        <div className="container py-16 sm:py-20">
          <div>
            <p className="kclub-section-label">{t('eyebrow')}</p>
            <h1 className="mt-5 max-w-5xl text-5xl font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white sm:text-7xl">
              {t('title')}
            </h1>
          </div>

          <div className="mx-auto mt-12 w-full max-w-3xl">
            {/* Search Bar */}
            <div className="relative w-full">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search partners..."
                className="focus:ring-brand w-full rounded-full border border-zinc-200 bg-zinc-100 py-4 pl-14 pr-14 text-zinc-900 outline-none transition-all focus:border-transparent focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
              />
              <Mic className="absolute right-5 top-1/2 -translate-y-1/2 text-[#EBB34F]" size={20} />
            </div>

            <DirectoryTaxonomyFilter
              locale={locale}
              categoryTree={categoryTree}
              activeSphere={activeSelection.sphere}
              activeCategory={activeSelection.category}
              activeActivity={activeSelection.activity}
            />
          </div>
        </div>
      </section>

      <div className="container py-14 sm:py-20">
        <div>
          {businesses.length === 0 ? (
            <EmptyState
              icon={<Building2 aria-hidden="true" size={44} strokeWidth={1.5} />}
              title={t('emptyTitle')}
              description={t('emptyDescription')}
              action={
                <Link
                  href={`/${locale}/sign-up`}
                  className={getButtonClasses({ color: 'brand', size: 'md' })}
                >
                  {t('emptyAction')}
                  <ArrowRight aria-hidden="true" size={16} strokeWidth={1.7} />
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
              {businesses.map((business) => {
                // Add a featured label to display just to keep parity
                let featuredLabel: string | undefined;
                if (business.featuredTop) featuredLabel = t('featuredTopLabel');
                else if (business.featuredRecommended) featuredLabel = t('recommendedLabel');

                return (
                  <BusinessCard
                    key={business.id}
                    business={business}
                    href={`/${locale}/directory/${business.slug}`}
                    actionLabel={t('viewDetails')}
                    externalLabel={t('website')}
                    {...(featuredLabel ? { featuredLabel } : {})}
                    locale={locale}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildCategoryTree(categories: CategoryDto[]): CategoryBranch[] {
  const activeCategories = categories.filter((item) => item.isActive);
  const blocks = activeCategories
    .filter((item) => item.level === 'BLOCK')
    .sort(compareCategories)
    .map((block) => ({
      ...block,
      categories: activeCategories
        .filter((item) => item.level === 'CATEGORY' && item.parentId === block.id)
        .sort(compareCategories)
        .map((category) => ({
          ...category,
          subcategories: activeCategories
            .filter((item) => item.level === 'SUBCATEGORY' && item.parentId === category.id)
            .sort(compareCategories),
        })),
    }));

  return blocks;
}

function compareCategories(left: CategoryDto, right: CategoryDto): number {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
}

function resolveActiveSelection(
  categoryTree: CategoryBranch[],
  requested: {
    sphere?: string | undefined;
    category?: string | undefined;
    activity?: string | undefined;
  },
): { sphere?: string; category?: string; activity?: string } {
  if (requested.activity) {
    for (const sphere of categoryTree) {
      for (const category of sphere.categories) {
        if (category.subcategories.some((activity) => activity.slug === requested.activity)) {
          return {
            sphere: sphere.slug,
            category: category.slug,
            activity: requested.activity,
          };
        }
      }
    }
  }

  if (requested.category) {
    for (const sphere of categoryTree) {
      if (sphere.categories.some((category) => category.slug === requested.category)) {
        return {
          sphere: requested.sphere ?? sphere.slug,
          category: requested.category,
        };
      }
    }
  }

  return requested.sphere ? { sphere: requested.sphere } : {};
}
