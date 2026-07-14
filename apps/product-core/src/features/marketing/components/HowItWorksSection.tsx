import { useTranslations } from 'next-intl';

type Step = {
  title: string;
  description: string;
};

export function HowItWorksSection(): React.ReactElement {
  const t = useTranslations('home');
  const steps = t.raw('howItWorks.steps') as Step[];

  return (
    <section id="how-it-works" className="kclub-border kclub-section-py border-b bg-surface-muted">
      <div className="kclub-shell">
        <p className="kclub-section-eyebrow">{t('howItWorks.eyebrow')}</p>
        <h2 className="kclub-section-title mt-5 max-w-3xl">{t('howItWorks.title')}</h2>

        <ol className="mt-12 space-y-8">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
                {index + 1}
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="kclub-section-copy mt-2">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
