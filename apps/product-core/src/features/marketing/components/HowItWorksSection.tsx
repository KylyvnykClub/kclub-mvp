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
      <p className="kclub-section-copy mb-8 text-base font-normal leading-relaxed">
        {step.description}
      </p>
    ),
  }));

  return (
    <section
      id="how-it-works"
      className="kclub-border kclub-section-py border-b bg-surface-muted dark:bg-surface-muted"
    >
      <div className="kclub-shell">
        <p className="kclub-section-eyebrow">
          {t('howItWorks.eyebrow')}
        </p>
        <h2 className="kclub-section-title mt-5 max-w-3xl">
          {t('howItWorks.title')}
        </h2>
      </div>
      <Timeline data={data} />
    </section>
  );
}
