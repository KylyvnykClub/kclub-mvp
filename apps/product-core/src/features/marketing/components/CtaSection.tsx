import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getButtonClasses } from '@kclub/ui';

import { Locale } from '@/i18n/routing';

export function CtaSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home');

  return (
    <section className="kclub-border kclub-section-py border-y bg-zinc-100 text-zinc-950 dark:bg-surface-raised dark:text-white">
      <div className="kclub-shell grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="kclub-section-eyebrow mb-5">KCLUB</p>
          <h2 className="kclub-section-title max-w-4xl">{t('cta.title')}</h2>
          <p className="kclub-section-copy mt-5 max-w-2xl text-base font-medium leading-8">
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
