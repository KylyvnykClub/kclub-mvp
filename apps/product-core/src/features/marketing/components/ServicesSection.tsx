'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Building2, ShieldCheck, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { getButtonClasses } from '@kclub/ui';

import { Locale } from '@/i18n/routing';

type MembershipCardCopy = {
  title: string;
  description: string;
  note?: string;
  cta: string;
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.12,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export function ServicesSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.services');
  const member = t.raw('member') as MembershipCardCopy;
  const partner = t.raw('partner') as MembershipCardCopy;
  const cards = [
    {
      ...member,
      icon: UserRound,
      number: '01',
      tone: 'light' as const,
    },
    {
      ...partner,
      icon: Building2,
      number: '02',
      tone: 'dark' as const,
    },
  ];

  return (
    <section
      id="membership"
      className="kclub-border kclub-section-py border-b bg-zinc-100 dark:bg-background"
    >
      <div className="kclub-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-5"
        >
          <p className="kclub-section-eyebrow">{t('eyebrow')}</p>
          <h2 className="kclub-section-title max-w-3xl">{t('title')}</h2>
        </motion.div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isDark = card.tone === 'dark';

            return (
              <motion.article
                custom={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-50px' }}
                key={card.title}
                className={`kclub-border-strong relative flex flex-col overflow-hidden border border-t-0 p-6 sm:p-9 ${
                  isDark
                    ? 'bg-zinc-950 text-white dark:bg-surface-raised'
                    : 'bg-white text-zinc-950 dark:bg-surface dark:text-white'
                }`}
              >
                {/* <div className="flex items-start justify-between gap-6">
                  <span
                    className={`flex h-14 w-14 items-center justify-center border ${
                      isDark ? 'border-white/20 text-accent' : 'kclub-border text-accent'
                    }`}
                  >
                    <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
                  </span>
                  <span
                    aria-hidden="true"
                    className={`text-sm font-black tracking-[0.2em] ${
                      isDark ? 'text-white/40' : 'text-zinc-400 dark:text-white/40'
                    }`}
                  >
                    {card.number}
                  </span>
                </div> */}

                <div className="flex flex-col">
                  <h3 className="max-w-md text-3xl font-black uppercase leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                    {card.title}
                  </h3>
                  <p
                    className={`mt-6 max-w-xl text-base leading-7 sm:text-lg ${
                      isDark ? 'text-white/70' : 'text-zinc-600 dark:text-white/70'
                    }`}
                  >
                    {card.description}
                  </p>

                  {/* {card.note ? (
                    <p
                      className={`mt-6 flex max-w-xl items-start gap-3 border-t pt-5 text-sm leading-6 ${
                        isDark
                          ? 'border-white/15 text-white/60'
                          : 'kclub-border text-zinc-500 dark:text-white/60'
                      }`}
                    >
                      <ShieldCheck
                        aria-hidden="true"
                        size={18}
                        strokeWidth={1.5}
                        className="mt-0.5 shrink-0 text-accent"
                      />
                      <span>{card.note}</span>
                    </p>
                  ) : null} */}
                </div>

                <Link
                  href={`/${locale}/sign-up`}
                  className={getButtonClasses({
                    color: 'brand',
                    size: 'lg',
                    fullWidth: true,
                    className: 'mx-auto mt-10 text-center sm:w-fit sm:min-w-72',
                  })}
                >
                  {card.cta}
                  <ArrowUpRight aria-hidden="true" size={20} />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
