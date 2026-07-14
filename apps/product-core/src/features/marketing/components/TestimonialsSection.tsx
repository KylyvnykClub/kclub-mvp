import { useTranslations } from 'next-intl';

type Testimonial = {
  quote: string;
  author: string;
  initials: string;
  tier: string;
};

export function TestimonialsSection() {
  const t = useTranslations('home');
  const items = t.raw('testimonials.items') as Testimonial[];

  return (
    <section className="kclub-border border-b bg-white py-16 dark:bg-background sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <p className="border-l-4 border-accent pl-4 text-xs font-bold uppercase text-zinc-500 dark:text-white/60">
          {t('testimonials.eyebrow')}
        </p>
        <h2 className="mt-5 max-w-4xl text-4xl font-black uppercase leading-tight text-zinc-950 dark:text-white sm:text-6xl">
          {t('testimonials.title')}
        </h2>
        <div className="kclub-border-strong mt-12 grid gap-px border bg-zinc-300 dark:bg-white/10 lg:grid-cols-3">
          {items.map((item) => (
            <figure key={item.author} className="bg-white p-6 dark:bg-surface sm:p-8">
              <blockquote className="kclub-section-copy font-semibold text-zinc-950 dark:text-white">
                {item.quote}
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center bg-zinc-950 text-xs font-black text-white dark:bg-white dark:text-zinc-950">
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-950 dark:text-white">{item.author}</p>
                  <p className="mt-1 inline-flex border border-accent px-2 py-1 text-xs font-bold uppercase text-accent">
                    {item.tier}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
