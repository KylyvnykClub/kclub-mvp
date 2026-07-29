'use client';

import Image, { type StaticImageData } from 'next/image';
import { type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@kclub/ui';

import awardCertificateIcon from '@/assets/icons/about/award-certificate.svg';
import creditCardIcon from '@/assets/icons/about/credit-card.svg';
import globePointerIcon from '@/assets/icons/about/globe-pointer.svg';
import handshakeIcon from '@/assets/icons/about/handshake.svg';
import shieldCheckIcon from '@/assets/icons/about/shield-check.svg';
import subscriptionIcon from '@/assets/icons/about/subscription-2.svg';
import heroBg from '@/assets/images/hero-bg.webp';

type FeatureItem = {
  title: string;
  description: string;
};

type FeatureProps = {
  description: string;
  icon: StaticImageData;
  index: number;
  title: string;
};

const FEATURE_ICONS = [
  creditCardIcon,
  awardCertificateIcon,
  globePointerIcon,
  handshakeIcon,
  subscriptionIcon,
  shieldCheckIcon,
] as const satisfies readonly StaticImageData[];

export function FeaturesSection(): React.ReactElement {
  const t = useTranslations('home');
  const items = t.raw('features.items') as FeatureItem[];

  return (
    <section className="kclub-border relative overflow-hidden border-b bg-surface-muted py-16 dark:bg-surface-muted sm:py-24">
      <div
        className="kclub-hero-visual absolute inset-x-0 top-0 h-[480px] sm:inset-0 sm:h-auto"
        style={{ '--hero-bg-image': `url(${heroBg.src})` } as CSSProperties}
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-transparent to-surface-muted sm:hidden"
        aria-hidden="true"
      />
      <div className="bg-background/60 dark:bg-background/40 absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="mb-12 grid gap-4 lg:items-end">
          <p className="border-l-4 border-accent pl-4 text-xs font-bold uppercase text-zinc-500 dark:text-white/60">
            {t('features.eyebrow')}
          </p>
          <h2 className="max-w-3xl text-4xl font-black uppercase leading-tight text-zinc-950 dark:text-white sm:text-6xl">
            {t('features.title')}
          </h2>
        </div>

        <div className="relative z-10 grid grid-cols-1 py-10 md:grid-cols-2 lg:grid-cols-3">
          {items.map((feature, index) => {
            const icon = FEATURE_ICONS[index];
            return (
              <Feature
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={icon}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Feature({ title, description, icon, index }: FeatureProps): React.ReactElement {
  return (
    <div
      className={cn(
        'group/feature relative flex flex-col border-border py-10 dark:border-border lg:border-r',
        (index === 0 || index === 3) && 'border-border dark:border-border lg:border-l',
        index < 3 && 'border-border dark:border-border lg:border-b',
      )}
    >
      {index < 3 && (
        <div className="pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-t from-zinc-100 to-transparent opacity-0 transition duration-200 group-hover/feature:opacity-100 dark:from-zinc-800/50" />
      )}
      {index >= 3 && (
        <div className="pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-b from-zinc-100 to-transparent opacity-0 transition duration-200 group-hover/feature:opacity-100 dark:from-zinc-800/50" />
      )}
      <div className="relative z-10 mb-4 px-10">
        <Image src={icon} alt="" className="size-16" aria-hidden="true" />
      </div>
      <div className="relative z-10 mb-2 px-10">
        <div className="absolute inset-y-0 left-0 h-6 w-1 origin-center rounded-br-full rounded-tr-full bg-zinc-300 transition-all duration-200 group-hover/feature:h-8 group-hover/feature:bg-accent dark:bg-zinc-700" />
        <span className="inline-block text-2xl font-black uppercase text-zinc-900 transition duration-200 group-hover/feature:translate-x-2 dark:text-zinc-100">
          {title}
        </span>
      </div>
      <p className="kclub-section-copy relative z-10 max-w-xs px-10">{description}</p>
    </div>
  );
}
