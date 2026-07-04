'use client';

import { useTranslations } from 'next-intl';

import { Timeline } from '@/components/ui/timeline';

type Step = {
  title: string;
  description: string;
};

export function HowItWorksSection() {
  const t = useTranslations('home');
  const steps = t.raw('howItWorks.steps') as Step[];

  const data = steps.map((step) => ({
    title: step.title,
    content: (
      <p className="mb-8 text-xs font-normal leading-relaxed text-zinc-600 dark:text-white/70 md:text-sm">
        {step.description}
      </p>
    ),
  }));

  return (
    <section
      id="how-it-works"
      className="kclub-border border-b bg-surface-muted py-16 dark:bg-surface-muted sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <p className="border-l-4 border-accent pl-4 text-xs font-bold uppercase text-zinc-500 dark:text-white/60">
          {t('howItWorks.eyebrow')}
        </p>
        <h2 className="mt-5 max-w-3xl text-4xl font-black uppercase leading-tight text-zinc-950 dark:text-white sm:text-6xl">
          {t('howItWorks.title')}
        </h2>
      </div>
      <Timeline data={data} />
    </section>
  );
}
