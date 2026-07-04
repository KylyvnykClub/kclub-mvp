'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { getButtonClasses } from '@kclub/ui';
import { CanvasText } from '@/components/ui/canvas-text';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

import dynamic from 'next/dynamic';

import { HeroFlagsCarousel } from '@/features/marketing/components/HeroFlagsCarousel';
import { Locale } from '@/i18n/routing';

const Globe = dynamic(() => import('@/components/ui/globe').then((m) => m.World), {
  ssr: false,
});

const globeConfigDark = {
  pointSize: 4,
  globeColor: "#3f3f46",       // zinc-700 — видимый тёмно-серый
  showAtmosphere: true,
  atmosphereColor: "#71717a",  // zinc-500
  atmosphereAltitude: 0.1,
  emissive: "#27272a",         // zinc-800
  emissiveIntensity: 0.15,
  shininess: 0.8,
  polygonColor: "rgba(255,255,255,0.6)",
  ambientLight: "#d4d4d8",
  directionalLeftLight: "#a1a1aa",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 1000,
  arcLength: 0.9,
  arcDashGap: 2,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 22.3193, lng: 114.1694 },
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

const globeConfigLight = {
  pointSize: 4,
  globeColor: "#71717a",       // zinc-500 — средне-серый
  showAtmosphere: true,
  atmosphereColor: "#a1a1aa",  // zinc-400
  atmosphereAltitude: 0.1,
  emissive: "#52525b",         // zinc-600
  emissiveIntensity: 0.08,
  shininess: 0.5,
  polygonColor: "rgba(255,255,255,0.55)",
  ambientLight: "#d4d4d8",
  directionalLeftLight: "#a1a1aa",
  directionalTopLight: "#e4e4e7",
  pointLight: "#e4e4e7",
  arcTime: 1000,
  arcLength: 0.9,
  arcDashGap: 2,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 22.3193, lng: 114.1694 },
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

const baseGlobeData = [
  { order: 1, startLat: 40.7128, startLng: -74.0060, endLat: 51.5072, endLng: -0.1276, arcAlt: 0.2 },
  { order: 2, startLat: 51.5072, startLng: -0.1276, endLat: 25.2048, endLng: 55.2708, arcAlt: 0.2 },
  { order: 3, startLat: 25.2048, startLng: 55.2708, endLat: 1.3521, endLng: 103.8198, arcAlt: 0.2 },
  { order: 4, startLat: 1.3521, startLng: 103.8198, endLat: -33.8688, endLng: 151.2093, arcAlt: 0.3 },
  { order: 5, startLat: -33.8688, startLng: 151.2093, endLat: 35.6762, endLng: 139.6503, arcAlt: 0.3 },
  { order: 6, startLat: 35.6762, startLng: 139.6503, endLat: 37.7749, endLng: -122.4194, arcAlt: 0.3 },
  { order: 7, startLat: 37.7749, startLng: -122.4194, endLat: 40.7128, endLng: -74.0060, arcAlt: 0.2 },
  { order: 8, startLat: 51.5072, startLng: -0.1276, endLat: -23.5505, endLng: -46.6333, arcAlt: 0.3 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export function HeroSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home');
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [accentColor, setAccentColor] = useState('#d4af37');

  useEffect(() => {
    setMounted(true);
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue('--accent').trim();
    if (color) setAccentColor(color);
  }, []);

  // Before mount, assume light (SSR default). After mount, use real theme.
  const isDark = mounted && resolvedTheme === 'dark';

  const globeConfig = isDark ? globeConfigDark : globeConfigLight;
  const dynamicGlobeData = baseGlobeData.map((d) => ({ ...d, color: accentColor }));

  return (
    <section className="kclub-premium-hero relative isolate flex min-h-[calc(100vh-112px)] flex-col overflow-hidden border-b border-zinc-200 dark:border-border">
      <div className="kclub-premium-hero-tint absolute inset-0" aria-hidden="true" />
      <div className="kclub-premium-hero-fade absolute bottom-0 left-0 right-0 h-24" aria-hidden="true" />
      <div
        className="kclub-animate-draw-y absolute inset-y-0 right-[10%] hidden w-px bg-zinc-300/80 dark:bg-white/10 lg:block"
        aria-hidden="true"
      />
      <div
        className="kclub-animate-draw-x absolute left-0 top-[6.625rem] hidden h-px w-full bg-zinc-300/70 dark:bg-white/10 lg:block"
        aria-hidden="true"
      />

      {/* Globe Background */}
      <div
        className={`absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none lg:justify-end ${
          isDark ? 'opacity-60 mix-blend-screen' : 'opacity-55 mix-blend-normal'
        }`}
      >
        <div className="relative h-full w-full max-w-[800px] sm:max-w-[1000px] lg:max-w-[1200px] lg:translate-x-1/4">
          <Globe globeConfig={globeConfig} data={dynamicGlobeData} />
        </div>

        {/* Vignette overlays */}
        <div className="absolute inset-0 pointer-events-none select-none bg-[radial-gradient(ellipse_at_center,transparent_10%,var(--background)_100%)] z-40" />
        <div className="absolute w-full bottom-0 inset-x-0 h-40 bg-gradient-to-b pointer-events-none select-none from-transparent to-background z-40" />
      </div>

      <div className="relative z-10 mx-auto flex flex-col min-h-0 w-full max-w-7xl flex-1 justify-center gap-11 px-4 py-16 sm:px-6 sm:py-20 lg:gap-20 lg:px-10 lg:py-[6.625rem]">
        <motion.div
          className="min-w-0 max-w-3xl lg:pr-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.p
            variants={itemVariants}
            className="kclub-section-label kclub-section-copy mb-11 border-l border-accent pl-4 text-xs font-semibold uppercase tracking-[0.24em]"
          >
            {t('hero.eyebrow')}
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="w-full mb-11 text-5xl sm:text-6xl md:text-7xl lg:text-[90px] font-bold leading-[1.05] tracking-tight text-foreground uppercase font-[helvetica]"
          >
            <span className="block">
              {t('hero.titleLine1')}
            </span>
            <span className="block mt-2">
              {t('hero.titleLine2').toUpperCase().split(' ').slice(0, -1).join(' ')}{' '}
              <CanvasText
                text={t('hero.titleLine2').toUpperCase().split(' ').pop() || ''}
                backgroundClassName={isDark ? 'bg-[#0f0f0f]' : 'bg-background'}
                colors={[
                  accentColor,
                  isDark ? "#ffffff" : "#18181b",
                  accentColor,
                  isDark ? "#a1a1aa" : "#52525b",
                ]}
                animationDuration={8}
                lineGap={1}
                lineWidth={3}
                curveIntensity={20}
              />
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="kclub-hero-copy mt-11">{t('hero.subline')}</motion.p>

          <motion.div variants={itemVariants} className="mt-11 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <Link
              href={`/${locale}/sign-up`}
              className={getButtonClasses({ color: 'brand', size: 'lg', className: 'w-full sm:w-auto' })}
            >
              <span>{t('hero.primaryCta')}</span>
              <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2} />
            </Link>
            <Link
              href={`/${locale}/directory`}
              className={getButtonClasses({ color: 'brand-secondary', size: 'lg', className: 'w-full sm:w-auto' })}
            >
              <span>{t('hero.secondaryCta')}</span>
              <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2} />
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-20 grid gap-8 border-t border-zinc-200 pt-8 dark:border-border sm:grid-cols-3"
          >
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
          </motion.div>
        </motion.div>
      </div>

      {/* <HeroFlagsCarousel /> */}
    </section>
  );
}
