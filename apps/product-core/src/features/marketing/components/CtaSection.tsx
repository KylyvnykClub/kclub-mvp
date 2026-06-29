import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getButtonClasses } from '@kclub/ui';

import { Locale } from '@/i18n/routing';

export function CtaSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home');

  return (
    <section className="kclub-border border-y bg-zinc-100 py-16 text-zinc-950 dark:bg-surface-raised dark:text-white sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10">
        <div>
          <p className="mb-5 border-l-4 border-accent pl-4 text-xs font-bold uppercase text-zinc-500 dark:text-white/60">
            KCLUB
          </p>
          <h2 className="max-w-4xl text-4xl font-black uppercase leading-tight sm:text-6xl">
            {t('cta.title')}
          </h2>
          <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-zinc-600 dark:text-white/70">
            {t('cta.subline')}
          </p>
        </div>
        <Link
          href={`/${locale}/sign-up`}
          className={getButtonClasses({
            color: 'brand',
            size: 'lg',
            className: 'min-w-56',
          })}
        >
          {t('cta.button')}
          <ArrowUpRight aria-hidden="true" size={20} />
        </Link>
      </div>
    </section>
  );
}
