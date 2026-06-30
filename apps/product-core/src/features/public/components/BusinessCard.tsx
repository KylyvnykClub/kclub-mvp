import { ArrowUpRight, ExternalLink, MapPin } from 'lucide-react';
import Link from 'next/link';

import type { PublicBusinessListItemDto } from '@kclub/contracts';
import { Badge, cn, getButtonClasses } from '@kclub/ui';

import { getBusinessLocation, getPrimaryBusinessUrl } from '../public-page-helpers';

export function BusinessCard({
  business,
  href,
  actionLabel,
  externalLabel,
  featuredLabel,
  compact = false,
}: {
  business: PublicBusinessListItemDto;
  href: string;
  actionLabel: string;
  externalLabel: string;
  featuredLabel?: string;
  compact?: boolean;
}) {
  const externalUrl = getPrimaryBusinessUrl(business);

  return (
    <article
      className={cn(
        'group relative flex w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md dark:border-white/10 dark:bg-[#1c1c1e] dark:text-white transition-all hover:shadow-lg',
        'flex-row sm:flex-col',
        compact ? 'min-h-[160px]' : 'min-h-[180px]',
      )}
    >
      {/* Discount Ribbon */}
      {business.memberDiscountPercent ? (
        <div className="absolute right-0 top-0 z-10 w-12 sm:w-16">
          <svg viewBox="0 0 100 120" className="h-auto w-full fill-[#EBB34F] drop-shadow-md" preserveAspectRatio="none">
            <path d="M0,0 L100,0 L100,90 L50,120 L0,90 Z" />
            <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="text-[28px] font-black fill-black">
              -{business.memberDiscountPercent}%
            </text>
          </svg>
        </div>
      ) : null}

      {/* Cover Image */}
      <div className="relative w-2/5 sm:w-full shrink-0 sm:h-[220px] bg-zinc-200 dark:bg-zinc-800">
        {business.coverImageUrl ? (
          <img src={business.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5 lg:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-1 pr-10 sm:pr-14">
            <h3 className="line-clamp-2 text-base font-bold leading-tight tracking-tight text-zinc-950 dark:text-white sm:text-2xl sm:uppercase sm:font-black">
              {business.name}
            </h3>
            <p className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 sm:text-sm">
              <MapPin aria-hidden="true" size={14} strokeWidth={1.5} />
              {getBusinessLocation(business)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 sm:text-sm">
              {business.categoryName}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-5 flex flex-col gap-3">
          <Link
            href={href}
            className={getButtonClasses({ color: 'brand', size: 'sm', className: 'w-full' })}
          >
            {actionLabel}
            <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.7} />
          </Link>
          {externalUrl ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="mx-auto inline-flex items-center gap-1.5 text-[11px] sm:text-sm font-medium text-zinc-500 transition hover:text-zinc-800 hover:underline dark:text-white/58 dark:hover:text-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-focus"
            >
              <ExternalLink aria-hidden="true" size={14} strokeWidth={1.5} />
              {externalLabel}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
