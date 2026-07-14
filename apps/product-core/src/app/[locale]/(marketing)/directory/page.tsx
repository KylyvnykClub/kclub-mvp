import {
  ArrowRight,
  Building2,
  Search,
  Mic,
  Home,
  Car,
  Utensils,
  Scale,
  HeartPulse,
  Plane,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { EmptyState, getButtonClasses } from '@kclub/ui';

import { BusinessCard } from '@/features/public/components/BusinessCard';
import { Locale } from '@/i18n/routing';
import { getCachedPublicBusinesses } from '@/server/cache/business-cache';
import { getCachedCategories } from '@/server/cache/taxonomy-cache';

function getCategoryIcon(slug: string, size = 28) {
  switch (slug) {
    case 'real-estate':
      return <Home size={size} />;
    case 'luxury-cars':
      return <Car size={size} />;
    case 'restaurants':
      return <Utensils size={size} />;
    case 'legal-services':
      return <Scale size={size} />;
    case 'health':
      return <HeartPulse size={size} />;
    case 'travel':
      return <Plane size={size} />;
    default:
      return <LayoutGrid size={size} />;
  }
}

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

export default async function DirectoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category: activeCategory } = await searchParams;

  const t = await getTranslations({ locale, namespace: 'directory' });
  const [allBusinesses, categories] = await Promise.all([
    getCachedPublicBusinesses(),
    getCachedCategories(),
  ]);

  const businesses = activeCategory
    ? allBusinesses.filter(
        (b) =>
          b.categoryName.toLowerCase() ===
          categories.find((c) => c.slug === activeCategory)?.name.toLowerCase(),
      )
    : allBusinesses;

  return (
    <div className="kclub-page-band">
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

            {/* Categories (Mobile Only) */}
            <div className="scrollbar-hide mt-8 flex snap-x gap-6 overflow-x-auto pb-4 md:hidden">
              <Link
                href={`/${locale}/directory`}
                className={`flex shrink-0 cursor-pointer snap-start flex-col items-center gap-2 transition ${!activeCategory ? 'text-[#EBB34F]' : 'text-zinc-400 hover:text-zinc-300'}`}
              >
                <LayoutGrid size={28} />
                <span className="text-xs font-medium">All</span>
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/${locale}/directory?category=${c.slug}`}
                  className={`flex shrink-0 cursor-pointer snap-start flex-col items-center gap-2 transition ${activeCategory === c.slug ? 'text-[#EBB34F]' : 'text-zinc-400 hover:text-zinc-300'}`}
                >
                  {getCategoryIcon(c.slug, 28)}
                  <span className="text-xs font-medium">{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container flex flex-col gap-8 py-14 sm:py-20 md:flex-row lg:gap-12">
        {/* Sidebar Filter (Desktop Only) */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-24">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
              Categories
            </h3>
            <div className="flex flex-col gap-1.5">
              <Link
                href={`/${locale}/directory`}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${!activeCategory ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-white/10 dark:text-white' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-white/5'}`}
              >
                All Partners
                {!activeCategory && <ChevronRight size={16} />}
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/${locale}/directory?category=${c.slug}`}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${activeCategory === c.slug ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-white/10 dark:text-white' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-white/5'}`}
                >
                  {c.name}
                  {activeCategory === c.slug && <ChevronRight size={16} />}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Grid */}
        <div className="flex-1">
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
                let featuredLabel = undefined;
                if (business.featuredTop) featuredLabel = t('featuredTopLabel');
                else if (business.featuredRecommended) featuredLabel = t('recommendedLabel');

                return (
                  <BusinessCard
                    key={business.id}
                    business={business}
                    href={`/${locale}/directory/${business.slug}`}
                    actionLabel={t('viewDetails')}
                    externalLabel={t('website')}
                    featuredLabel={featuredLabel}
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
