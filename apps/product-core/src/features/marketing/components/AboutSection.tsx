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
      <div className="kclub-shell">
        <div className="max-w-4xl">
          <p className="kclub-section-eyebrow">{t('about.eyebrow')}</p>
          <h2 id="about-title" className="kclub-section-title mt-5">
            {t('about.title')}
          </h2>
          <div className="kclub-section-copy mt-8 grid gap-5 text-base leading-7 sm:text-lg sm:leading-8">
            <p>{t('about.introduction')}</p>
            <p>{t('about.community')}</p>
          </div>
        </div>

        <div className="mt-12 border-y border-border py-8 sm:mt-16 sm:py-10">
          <p className="kclub-section-label">{t('about.mission.eyebrow')}</p>
          <h3 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
            {t('about.mission.title')}
          </h3>
          <p className="kclub-section-copy mt-4 max-w-3xl text-base leading-7 sm:text-lg sm:leading-8">
            {t('about.mission.description')}
          </p>
        </div>

        <div className="mt-12 sm:mt-16">
          <p className="kclub-section-eyebrow">{t('about.audiences.eyebrow')}</p>
          <h3 className="mt-5 text-2xl font-semibold text-foreground sm:text-3xl">
            {t('about.audiences.title')}
          </h3>
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

        <div className="mt-12 sm:mt-16">
          <p className="kclub-section-eyebrow">{t('about.benefits.eyebrow')}</p>
          <h3 className="mt-5 text-2xl font-semibold text-foreground sm:text-3xl">
            {t('about.benefits.title')}
          </h3>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <BenefitItem
              label={t('about.benefits.international.label')}
              title={t('about.benefits.international.title')}
              description={t('about.benefits.international.description')}
              icon={<Globe2 aria-hidden size={24} strokeWidth={1.5} />}
            />
            <BenefitItem
              label={t('about.benefits.card.label')}
              title={t('about.benefits.card.title')}
              description={t('about.benefits.card.description')}
              icon={<QrCode aria-hidden size={24} strokeWidth={1.5} />}
            />
            <BenefitItem
              label={t('about.benefits.offers.label')}
              title={t('about.benefits.offers.title')}
              description={t('about.benefits.offers.description')}
              icon={<BadgeCheck aria-hidden size={24} strokeWidth={1.5} />}
            />
            <BenefitItem
              label={t('about.benefits.directory.label')}
              title={t('about.benefits.directory.title')}
              description={t('about.benefits.directory.description')}
              icon={<Building2 aria-hidden size={24} strokeWidth={1.5} />}
            />
            <BenefitItem
              label={t('about.benefits.connections.label')}
              title={t('about.benefits.connections.title')}
              description={t('about.benefits.connections.description')}
              icon={<Handshake aria-hidden size={24} strokeWidth={1.5} />}
            />
            <BenefitItem
              label={t('about.benefits.privacy.label')}
              title={t('about.benefits.privacy.title')}
              description={t('about.benefits.privacy.description')}
              icon={<ShieldCheck aria-hidden size={24} strokeWidth={1.5} />}
            />
          </ul>
        </div>
      </div>
    </section>
  );
}

function AudienceCard({ title, description }: AudienceCardProps): React.ReactElement {
  return (
    <Surface className="h-full max-w-none rounded-none border border-border bg-surface px-6 py-8 shadow-none sm:px-8 sm:py-10">
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
