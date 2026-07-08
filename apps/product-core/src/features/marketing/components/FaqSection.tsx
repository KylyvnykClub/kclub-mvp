'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqSection() {
  const t = useTranslations('home');
  const items = t.raw('faq.items') as FaqItem[];
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="kclub-border kclub-section-py border-b bg-surface-muted dark:bg-surface-muted">
      <div className="kclub-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="kclub-section-eyebrow">
            {t('faq.eyebrow')}
          </p>
          <h2 className="kclub-section-title mt-5">
            {t('faq.title')}
          </h2>
        </div>
        <div className="kclub-border-strong border-t bg-white dark:bg-surface">
          {items.map((item, index) => {
            const open = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
              <div key={item.question} className="kclub-border-strong border-b">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? -1 : index)}
                  className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-5 text-left text-base font-black uppercase text-zinc-950 outline-none transition hover:text-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent dark:text-white dark:focus-visible:ring-white"
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    size={18}
                    strokeWidth={1.5}
                    className={`shrink-0 text-accent transition ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!open}
                  className="kclub-section-copy px-5 pb-6 text-base font-medium leading-7"
                >
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
