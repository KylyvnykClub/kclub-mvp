'use client';

import { ArrowUpRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { getButtonClasses } from '@kclub/ui';

import { Locale } from '@/i18n/routing';

type PlanCopy = {
  name: string;
  price: string;
  cta: string;
  items: string[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function ServicesSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home');
  const member = t.raw('services.member') as PlanCopy;
  const vip = t.raw('services.vip') as PlanCopy;
  const business = t.raw('services.business') as PlanCopy;
  const plans = [
    { ...member, href: `/${locale}/sign-up`, featured: false },
    { ...vip, href: `/${locale}/sign-up`, featured: true },
    { ...business, href: `/${locale}/sign-up`, featured: false },
  ];

  return (
    <section className="kclub-border kclub-section-py border-b bg-white dark:bg-background">
      <div className="kclub-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="kclub-section-eyebrow">
            {t('services.eyebrow')}
          </p>
          <h2 className="kclub-section-title mt-5 max-w-4xl">
            {t('services.title')}
          </h2>
        </motion.div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="kclub-border-strong mt-12 grid items-stretch gap-px border bg-zinc-300 dark:bg-white/10 lg:grid-cols-3"
        >
          {plans.map((plan) => (
            <motion.article
              variants={itemVariants}
              key={plan.name}
              className={`flex h-full flex-col bg-white p-6 dark:bg-surface sm:p-9 ${plan.featured ? 'relative overflow-hidden' : ''}`}
            >
              {plan.featured ? <div className="absolute inset-x-0 top-0 h-1.5 bg-accent" /> : null}
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3 className="text-base font-black uppercase text-zinc-500 dark:text-white/60">
                    {plan.name}
                  </h3>
                  <p className="mt-5 text-5xl font-black text-zinc-950 dark:text-white">
                    {plan.price}
                  </p>
                </div>
                <span className="kclub-border flex h-12 w-12 items-center justify-center border text-accent">
                  <ArrowUpRight aria-hidden="true" size={22} />
                </span>
              </div>
              <ul className="mt-8 grid flex-1 gap-4">
                {plan.items.map((item) => (
                  <li
                    key={item}
                    className="kclub-section-copy flex gap-3 text-base font-medium leading-6"
                  >
                    <Check
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.5}
                      className="mt-1 shrink-0 text-accent"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={getButtonClasses({
                  color: plan.featured ? 'brand' : 'outline',
                  size: 'md',
                  fullWidth: true,
                  className: 'mt-8 flex h-14 shrink-0',
                })}
              >
                {plan.cta}
                <ArrowUpRight aria-hidden="true" size={18} />
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
