'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import type { PublicBusinessListItemDto } from '@kclub/contracts';

import { Locale } from '@/i18n/routing';

import { BusinessCard } from '@/features/public/components/BusinessCard';
import { MarketingCarousel, type MarketingCarouselLabels } from './MarketingCarousel';

export type MarketingBusinessCarouselProps = {
  header: ReactNode;
  locale: Locale;
  businesses: PublicBusinessListItemDto[];
  carouselLabels: MarketingCarouselLabels;
  actionLabel: string;
};

function getFeaturedLabel(
  business: PublicBusinessListItemDto,
  topLabel: string,
  recommendedLabel: string,
): string | null {
  if (business.featuredTop) {
    return topLabel;
  }

  if (business.featuredRecommended) {
    return recommendedLabel;
  }

  return null;
}

export function MarketingBusinessCarousel({
  header,
  locale,
  businesses,
  carouselLabels,
  actionLabel,
}: MarketingBusinessCarouselProps) {
  const t = useTranslations('home');

  return (
    <MarketingCarousel header={header} itemCount={businesses.length} labels={carouselLabels}>
      {businesses.map((business) => {
        const label = getFeaturedLabel(business, t('featured.topLabel'), t('featured.recommendedLabel'));
        return (
        <div
          key={business.id}
          className="flex w-[20rem] shrink-0 snap-start sm:w-[22rem]"
          data-marketing-carousel-item
        >
          <div className="w-full">
            <BusinessCard
              actionLabel={actionLabel}
              business={business}
              externalLabel={t('common.website')}
              locale={locale}
              {...(label ? { featuredLabel: label } : {})}
              href={`/${locale}/directory/${business.slug}`}
            />
          </div>
        </div>
        );
      })}
    </MarketingCarousel>
  );
}
