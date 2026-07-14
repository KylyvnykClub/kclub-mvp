'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { HERO_FLAG_CODES, type HeroFlagCode } from '@/features/marketing/constants/hero-flag-codes';

function FlagMarqueeItem({ code, index }: { code: HeroFlagCode; index: number }) {
  return (
    <div className="kclub-hero-flag-item">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG flags served from local API route */}
      <img
        alt=""
        className="h-full w-full object-cover"
        decoding="async"
        draggable={false}
        height={36}
        loading={index < 24 ? 'eager' : 'lazy'}
        src={`/api/flags/${code}`}
        width={52}
      />
    </div>
  );
}

export function HeroFlagsCarousel() {
  const t = useTranslations('home');
  const flagItems = useMemo(() => [...HERO_FLAG_CODES, ...HERO_FLAG_CODES], []);

  return (
    <div className="kclub-hero-flags-carousel relative z-10 shrink-0 border-t border-zinc-200 dark:border-border">
      <p className="kclub-section-copy pb-6 pt-4 text-center text-zinc-500 dark:text-muted-foreground sm:pb-8 sm:pt-5">
        {t('hero.flagsMarquee')}
      </p>

      <div className="relative mx-auto w-full max-w-7xl select-none overflow-hidden pb-3 sm:pb-4">
        <div aria-hidden="true" className="kclub-hero-flags-fade kclub-hero-flags-fade-left" />

        <div
          className="kclub-flags-marquee-track flex w-max items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-10"
          aria-hidden="true"
        >
          {flagItems.map((code, index) => (
            <FlagMarqueeItem key={`${code}-${index}`} code={code} index={index} />
          ))}
        </div>

        <div aria-hidden="true" className="kclub-hero-flags-fade kclub-hero-flags-fade-right" />
      </div>
    </div>
  );
}
