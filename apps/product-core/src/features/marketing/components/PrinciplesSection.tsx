import { useTranslations } from 'next-intl';

type PrincipleKey = 'trust' | 'mutualBenefit' | 'quality' | 'privacy' | 'international';

const PRINCIPLES = [
  'trust',
  'mutualBenefit',
  'quality',
  'privacy',
  'international',
] as const satisfies readonly PrincipleKey[];

export function PrinciplesSection(): React.ReactElement {
  const t = useTranslations('home');

  return (
    <section
      id="principles"
      aria-labelledby="principles-title"
      className="kclub-border kclub-section-py overflow-hidden border-b bg-background"
    >
      <div className="kclub-shell">
        <header className="">
          <p className="kclub-section-eyebrow">{t('principles.eyebrow')}</p>
          <h2 id="principles-title" className="kclub-section-title mt-5 max-w-4xl">
            {t('principles.title')}
          </h2>
        </header>

        <ol className="kclub-border mt-10 border-y sm:mt-14">
          {PRINCIPLES.map((principleKey, index) => (
            <li
              key={principleKey}
              className="grid gap-4 border-b border-border py-6 last:border-b-0 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-8 sm:py-8"
            >
              <span
                className="text-3xl font-semibold tracking-tight text-foreground"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="grid gap-2">
                <h3 className="text-2xl font-semibold text-foreground">
                  {t(`principles.items.${principleKey}.title`)}
                </h3>
                <p className="kclub-section-copy">
                  {t(`principles.items.${principleKey}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
