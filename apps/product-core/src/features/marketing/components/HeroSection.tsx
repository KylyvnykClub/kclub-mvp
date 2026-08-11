'use client';

import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { getButtonClasses } from '@kclub/ui';

import mapImage from '@/assets/content/map.png';
import { CanvasText } from '@/components/ui/canvas-text';
import { Locale } from '@/i18n/routing';

export function HeroSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home');
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const accentColor = '#d4af37';
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <section className="kclub-premium-hero relative isolate flex min-h-[calc(100dvh-72px)] min-h-[calc(100svh-72px)] flex-col overflow-hidden border-b border-zinc-200 dark:border-border">
      <div className="kclub-premium-hero-tint absolute inset-0" aria-hidden="true" />
      <div
        className="kclub-premium-hero-fade absolute bottom-0 left-0 right-0 h-24"
        aria-hidden="true"
      />
      <div
        className="kclub-animate-draw-y absolute inset-y-0 right-[10%] hidden w-px bg-zinc-300/80 dark:bg-white/10 lg:block"
        aria-hidden="true"
      />
      <div
        className="kclub-animate-draw-x absolute left-0 top-[6.625rem] hidden h-px w-full bg-zinc-300/70 dark:bg-white/10 lg:block"
        aria-hidden="true"
      />

      {/* Map Background */}
      <div
        className={`pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden lg:justify-end ${
          isDark ? 'opacity-60 mix-blend-screen' : 'opacity-55 mix-blend-normal'
        }`}
      >
        <Image src={mapImage} alt="" fill sizes="100vw" className="object-cover" priority />

        {/* Vignette overlays */}
        <div className="pointer-events-none absolute inset-0 z-40 select-none bg-[radial-gradient(ellipse_at_center,transparent_10%,var(--background)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-40 w-full select-none bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col justify-center gap-11 px-4 py-16 sm:px-6 sm:py-20 lg:gap-20 lg:px-10 lg:py-[6.625rem]">
        <div className="kclub-hero-reveal min-w-0 max-w-3xl lg:pr-6">
          <p className="mb-11 border-l border-accent pl-4 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-600 dark:text-white/70">
            {t('hero.eyebrow')}
          </p>

          <h1 className="mb-11 w-full font-[helvetica] text-5xl font-bold uppercase leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[90px]">
            <span className="block">{t('hero.titleLine1')}</span>
            <span className="mt-2 block">
              {t('hero.titleLine2').toUpperCase().split(' ').slice(0, -1).join(' ')}{' '}
              <CanvasText
                text={t('hero.titleLine2').toUpperCase().split(' ').pop() || ''}
                backgroundClassName={isDark ? 'bg-[#0f0f0f]' : 'bg-background'}
                colors={[
                  accentColor,
                  isDark ? '#ffffff' : '#18181b',
                  accentColor,
                  isDark ? '#a1a1aa' : '#52525b',
                ]}
                animationDuration={8}
                lineGap={1}
                lineWidth={3}
                curveIntensity={20}
              />
            </span>
          </h1>

          <p className="mt-11 text-3xl font-thin">{t('hero.subline')}</p>

          <div className="mt-11 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <Link
              href={`/${locale}/sign-up`}
              className={getButtonClasses({
                color: 'brand',
                size: 'lg',
                className: 'w-full sm:w-auto',
              })}
            >
              <span>{t('hero.primaryCta')}</span>
              <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2} />
            </Link>
            <Link
              href={`/${locale}/directory`}
              className={getButtonClasses({
                color: 'brand-secondary',
                size: 'lg',
                className: 'w-full sm:w-auto',
              })}
            >
              <span>{t('hero.secondaryCta')}</span>
              <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2} />
            </Link>
          </div>

          <div className="mt-20 grid gap-8 border-t border-zinc-200 pt-8 dark:border-border sm:grid-cols-3">
            <div className="kclub-hero-stat">
              <p className="kclub-hero-stat-label">{t('hero.stats.verified.title')}</p>
              <p className="kclub-hero-stat-copy">{t('hero.stats.verified.copy')}</p>
            </div>
            <div className="kclub-hero-stat">
              <p className="kclub-hero-stat-label">{t('hero.stats.access.title')}</p>
              <p className="kclub-hero-stat-copy">{t('hero.stats.access.copy')}</p>
            </div>
            <div className="kclub-hero-stat">
              <p className="kclub-hero-stat-label">{t('hero.stats.reach.title')}</p>
              <p className="kclub-hero-stat-copy">{t('hero.stats.reach.copy')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
