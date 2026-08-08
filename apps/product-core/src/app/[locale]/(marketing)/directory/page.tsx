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
    <div className="flex w-full flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-10 px-4 py-10 md:px-20 md:py-20">
        {/* Page Header & Search */}
        <div className="flex w-full flex-col gap-6">
          <h1 className="text-4xl font-semibold text-foreground md:text-5xl">
            {t('title')}
          </h1>
          <p className="max-w-2xl text-[15px] text-muted-foreground">
            {t('description')}
          </p>

          <div className="relative mt-4 w-full max-w-3xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} />
            <input
              type="text"
              placeholder="Search partners, services, or locations..."
              className="w-full rounded-lg border border-border bg-surface py-4 pl-12 pr-4 text-[15px] text-foreground transition-all placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <DirectoryTaxonomyFilter
          locale={locale}
          categoryTree={categoryTree}
          activeSphere={activeSelection.sphere}
          activeCategory={activeSelection.category}
          activeActivity={activeSelection.activity}
        />

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
          <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => {
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

        {/* Load More */}
        {businesses.length > 0 && (
          <div className="mt-8 flex w-full justify-center">
            <button className="rounded border border-accent bg-transparent px-8 py-3 text-[13px] font-medium uppercase tracking-widest text-accent transition-all hover:bg-accent/10 active:scale-95">
              Show All Partners
            </button>
          </div>
        )}
      </main>
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
