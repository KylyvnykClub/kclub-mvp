'use client';

import { BadgeCheck, Building2, Globe2, Handshake, QrCode, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { cn } from '@kclub/ui';
import { type CSSProperties } from 'react';
import heroBg from '@/assets/images/hero-bg.png';
type FeatureItem = {
  title: string;
  description: string;
};

const icons = [QrCode, BadgeCheck, Building2, Handshake, Globe2, ShieldCheck] as const;

export function FeaturesSection() {
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
        <motion.div
          className="mb-12 grid gap-4 lg:items-end"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="border-l-4 border-accent pl-4 text-xs font-bold uppercase text-zinc-500 dark:text-white/60">
            {t('features.eyebrow')}
          </p>
          <h2 className="max-w-3xl text-4xl font-black uppercase leading-tight text-zinc-950 dark:text-white sm:text-6xl">
            {t('features.title')}
          </h2>
        </motion.div>

        <div className="relative z-10 grid grid-cols-1 py-10 md:grid-cols-2 lg:grid-cols-3">
          {items.map((feature, index) => {
            const Icon = icons[index];
            return (
              <Feature
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={<Icon size={24} strokeWidth={1.5} />}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
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
      <div className="relative z-10 mb-4 px-10 text-zinc-500 dark:text-zinc-400">{icon}</div>
      <div className="relative z-10 mb-2 px-10 text-lg font-bold">
        <div className="absolute inset-y-0 left-0 h-6 w-1 origin-center rounded-br-full rounded-tr-full bg-zinc-300 transition-all duration-200 group-hover/feature:h-8 group-hover/feature:bg-accent dark:bg-zinc-700" />
        <span className="inline-block font-black uppercase text-zinc-900 transition duration-200 group-hover/feature:translate-x-2 dark:text-zinc-100">
          {title}
        </span>
      </div>
      <p className="relative z-10 max-w-xs px-10 text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-300">
        {description}
      </p>
    </motion.div>
  );
};
