import { ArrowRight, ExternalLink, MapPin } from 'lucide-react';
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
        'flex h-full flex-col border border-zinc-200 bg-white p-6 text-zinc-950 shadow-[0_24px_60px_-44px_rgba(0,0,0,0.6)] dark:border-white/10 dark:bg-[#141416] dark:text-white',
        compact ? 'gap-5' : 'gap-7',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{business.categoryName}</Badge>
        {featuredLabel ? <Badge variant="success">{featuredLabel}</Badge> : null}
      </div>

      <div>
        <h3 className="text-2xl font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white">
          {business.name}
        </h3>
        <p className="dark:text-white/58 mt-3 inline-flex items-center gap-2 text-sm text-zinc-500">
          <MapPin aria-hidden="true" size={16} strokeWidth={1.5} />
          {getBusinessLocation(business)}
        </p>
      </div>

      {business.briefDescription ? (
        <p className="dark:text-white/68 text-sm leading-7 text-zinc-600">
          {business.briefDescription}
        </p>
      ) : null}

      <div className="mt-auto flex flex-col gap-3">
        <Link
          href={href}
          className={getButtonClasses({ color: 'brand', size: 'sm', className: 'w-full sm:w-auto' })}
        >
          {actionLabel}
          <ArrowRight aria-hidden="true" size={16} strokeWidth={1.7} />
        </Link>
        {externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-800 hover:underline dark:text-white/58 dark:hover:text-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-focus"
          >
            <ExternalLink aria-hidden="true" size={16} strokeWidth={1.5} />
            {externalLabel}
          </a>
        ) : null}
      </div>
    </article>
  );
}
