import { MapPin, Building2, Utensils, Hotel, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

import type { PublicBusinessListItemDto } from '@kclub/contracts';
import { cn } from '@kclub/ui';

import { getBusinessLocation } from '../public-page-helpers';

// Helper to determine a basic icon based on category name roughly
function getCategoryIcon(categoryName: string, className?: string) {
  const lower = categoryName.toLowerCase();
  if (lower.includes('hospitality') || lower.includes('hotel'))
    return <Hotel className={className} />;
  if (lower.includes('dining') || lower.includes('restaurant'))
    return <Utensils className={className} />;
  if (lower.includes('retail') || lower.includes('shop'))
    return <ShoppingBag className={className} />;
  return <Building2 className={className} />;
}

export function BusinessCard({
  business,
  href,
  actionLabel: _actionLabel,
  externalLabel: _externalLabel,
  featuredLabel,
  compact = false,
  locale: _locale = 'en',
}: {
  business: PublicBusinessListItemDto;
  href: string;
  actionLabel: string;
  externalLabel: string;
  featuredLabel?: string;
  compact?: boolean;
  locale?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'border-accent/10 group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-none border bg-surface transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]',
        compact && 'sm:min-h-[250px]',
      )}
    >
      {/* Cover Image */}
      <div className="relative h-48 w-full overflow-hidden bg-surface-muted">
        {business.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.coverImageUrl}
            alt={business.name}
            className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-muted">
            {getCategoryIcon(business.categoryName, 'size-16 text-muted-foreground opacity-30')}
          </div>
        )}

        {/* Discount Ribbon (if any) */}
        {business.memberDiscountPercent ? (
          <div className="absolute right-4 top-4 bg-accent px-4 py-1 text-lg font-semibold text-accent-foreground shadow-sm">
            {business.discountMuted ? (
              <span className="select-none opacity-80 blur-[4px]" aria-hidden="true">
                %%
              </span>
            ) : (
              `${business.memberDiscountPercent}%`
            )}
          </div>
        ) : null}

        {/* Featured Label (if any) */}
        {featuredLabel ? (
          <div className="bg-background/80 border-accent/30 absolute left-4 top-4 border px-3 py-1 text-xs font-medium tracking-wide text-accent backdrop-blur-sm">
            {featuredLabel}
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex flex-grow flex-col p-5">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-[22px] font-semibold leading-tight text-foreground">
            {business.name}
          </h3>
          <div className="ml-4 shrink-0 text-accent">
            {getCategoryIcon(business.categoryName, 'size-6')}
          </div>
        </div>

        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-accent">
          {business.categoryName}
        </p>

        <div className="mt-auto flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <MapPin aria-hidden="true" className="size-4" />
          {getBusinessLocation(business)}
        </div>
      </div>
    </Link>
  );
}
