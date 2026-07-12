import { useTranslations } from 'next-intl';
import { BadgeCheck, Building2, Globe2, Handshake, QrCode, ShieldCheck } from 'lucide-react';

import { Surface } from '@kclub/ui';

type AudienceCardProps = {
  description: string;
  title: string;
};

type BenefitItemProps = {
  description: string;
  icon: React.ReactNode;
  label: string;
  title: string;
};

export function AboutSection(): React.ReactElement {
  const t = useTranslations('home');

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="kclub-border kclub-section-py border-b bg-surface-muted"
    >
      <div className="container">
        <div className="">
          <p className="kclub-section-eyebrow">{t('about.eyebrow')}</p>
          <h2 id="about-title" className="kclub-section-title mt-5">
            {t('about.title')}
          </h2>
          <div className="kclub-section-copy mt-8">
            <p>{t('about.introduction')}</p>
            <p>{t('about.community')}</p>
          </div>
        </div>

        <div className="py-8  sm:py-10">
          <p className="kclub-section-eyebrow">{t('about.mission.eyebrow')}</p>
          <h2 className="kclub-section-title mt-5 ">
            {t('about.mission.title')}
          </h2>
          <p className="kclub-section-copy mt-4 max-w-3xl">
            {t('about.mission.description')}
          </p>
        </div>

        <div className="">
          <p className="kclub-section-eyebrow">{t('about.audiences.eyebrow')}</p>
          <h2 className="kclub-section-title mt-5">
            {t('about.audiences.title')}
          </h2>
          <ul className="mt-8 grid gap-4 lg:grid-cols-3">
            <li>
              <AudienceCard
                title={t('about.audiences.members.title')}
                description={t('about.audiences.members.description')}
              />
            </li>
            <li>
              <AudienceCard
                title={t('about.audiences.professionals.title')}
                description={t('about.audiences.professionals.description')}
              />
            </li>
            <li>
              <AudienceCard
                title={t('about.audiences.companies.title')}
                description={t('about.audiences.companies.description')}
              />
            </li>
          </ul>
        </div>

     
      </div>
    </section>
  );
}

function AudienceCard({ title, description }: AudienceCardProps): React.ReactElement {
  return (
    <Surface className="h-full max-w-none rounded-none bg-surface px-6 py-8 shadow-none sm:rounded-none sm:px-8 sm:py-10">
      <h4 className="text-lg font-semibold text-foreground">{title}</h4>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </Surface>
  );
}

function BenefitItem({ label, title, description, icon }: BenefitItemProps): React.ReactElement {
  return (
    <li className="border-l border-accent bg-surface px-6 py-7 sm:px-8">
      <div className="text-accent">{icon}</div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <h4 className="mt-2 text-lg font-semibold text-foreground">{title}</h4>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </li>
  );
}
