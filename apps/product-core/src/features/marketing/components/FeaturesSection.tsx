'use client';

import { BadgeCheck, Building2, Globe2, Handshake, QrCode, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

type FeatureItem = {
  title: string;
  description: string;
};

const icons = [QrCode, BadgeCheck, Building2, Handshake, Globe2, ShieldCheck] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

export function FeaturesSection() {
  const t = useTranslations('home');
  const items = t.raw('features.items') as FeatureItem[];

  return (
    <section className="kclub-border border-b bg-surface-muted py-16 dark:bg-surface-muted sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <motion.div 
          className="grid gap-4 lg:items-end"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="border-l-4 border-accent pl-4 text-xs font-bold uppercase text-zinc-500 dark:text-white/60">
            {t('features.eyebrow')}
          </p>
          <h2 className="max-w-3xl text-4xl font-black uppercase leading-tight text-zinc-950 dark:text-white sm:text-6xl">
            {t('features.title')}
          </h2>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="kclub-border-strong mt-12 grid gap-px border bg-zinc-300 dark:bg-white/10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item, index) => {
            const Icon = icons[index];

            return (
              <motion.article
                variants={itemVariants}
                key={item.title}
                className="group bg-white p-6 transition-colors hover:bg-zinc-950 dark:bg-surface dark:hover:bg-surface-raised sm:p-8"
              >
                <div className="kclub-border flex h-12 w-12 items-center justify-center border text-accent transition-colors group-hover:border-white/20 group-hover:text-white">
                  <Icon aria-hidden="true" size={22} strokeWidth={1.6} />
                </div>
                <div className="my-7 h-px w-12 bg-accent" />
                <h3 className="text-xl font-black uppercase text-zinc-950 transition-colors group-hover:text-white dark:text-white">
                  {item.title}
                </h3>
                <p className="group-hover:text-white/72 mt-4 text-sm font-medium leading-7 text-zinc-600 transition-colors dark:text-white/70">
                  {item.description}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
