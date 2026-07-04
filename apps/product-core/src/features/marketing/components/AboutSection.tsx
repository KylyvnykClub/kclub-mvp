import { useTranslations } from 'next-intl';

type Fact = {
  label: string;
  value: string;
};

export function AboutSection() {
  const t = useTranslations('home');
  const facts = t.raw('about.facts') as Fact[];

  return (
    <section className="kclub-border kclub-section-py border-b bg-zinc-100 text-zinc-950 dark:bg-surface-raised dark:text-white">
      <div className="kclub-shell grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <p className="kclub-section-eyebrow">
            {t('about.eyebrow')}
          </p>
          <h2 className="kclub-section-title max-w-4xl">
            {t('about.title')}
          </h2>
          <div className="kclub-section-copy mt-8 grid max-w-2xl gap-5 text-base font-medium leading-8">
            <p>{t('about.paragraph1')}</p>
            <p>{t('about.paragraph2')}</p>
          </div>
        </div>
        <aside className="kclub-border dark:border-white/12 border bg-white/70 p-6 dark:bg-white/[0.04] sm:p-8">
          <h3 className="dark:text-white/58 text-base font-bold uppercase text-zinc-500">
            {t('about.factsTitle')}
          </h3>
          <dl className="mt-8 grid gap-6">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="kclub-border dark:border-white/12 border-b pb-6 last:border-b-0 last:pb-0"
              >
                <dt className="dark:text-white/54 text-xs font-bold uppercase text-zinc-500">
                  {fact.label}
                </dt>
                <dd className="mt-2 text-4xl font-black">
                  {fact.value}
                  <span className="text-accent">.</span>
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}
