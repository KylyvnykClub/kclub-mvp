import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { getButtonClasses } from '@kclub/ui';

import bannerImage from '@/assets/content/baner.webp';
import { Locale } from '@/i18n/routing';

export function CtaSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home');

  return (
    <section className="kclub-border kclub-section-py relative isolate overflow-hidden border-y bg-zinc-950 text-white">
      <Image
        src={bannerImage}
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-right lg:object-center"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-zinc-950/70" />

      <div className="kclub-shell grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="kclub-section-eyebrow mb-5 text-accent">KCLUB</p>
          <h2 className="kclub-section-title max-w-4xl">{t('cta.title')}</h2>
          <p className="kclub-section-copy mt-5 max-w-2xl text-white/75">{t('cta.subline')}</p>
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
