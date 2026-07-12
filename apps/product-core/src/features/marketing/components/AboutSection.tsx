import Image, { type StaticImageData } from 'next/image';
import { useTranslations } from 'next-intl';

import { Surface } from '@kclub/ui';

import aboutCompaniesImage from '@/assets/content/about_companies.webp';
import aboutConnectionImage from '@/assets/content/about_img-1.webp';
import aboutGlobalImage from '@/assets/content/about_img-2.webp';
import aboutMemberImage from '@/assets/content/about_member.webp';
import aboutMissionImage from '@/assets/content/about_mission.webp';
import aboutProfessionalImage from '@/assets/content/about_professional.webp';

type AudienceCardProps = {
  description: string;
  image: StaticImageData;
  title: string;
};

export function AboutSection(): React.ReactElement {
  const t = useTranslations('home');

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="kclub-border kclub-section-py overflow-hidden border-b bg-surface-muted"
    >
      <div className="kclub-shell">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="max-w-3xl">
            <p className="kclub-section-eyebrow">{t('about.eyebrow')}</p>
            <h2 id="about-title" className="kclub-section-title mt-5">
              {t('about.title')}
            </h2>
            <div className="kclub-section-copy mt-8 grid gap-5">
              <p>{t('about.introduction')}</p>
              <p>{t('about.community')}</p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl pb-12 sm:pb-16" aria-hidden="true">
            <div className="aspect-square overflow-hidden border border-border bg-surface shadow-sm">
              <Image
                src={aboutGlobalImage}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 ease-out supports-[hover:hover]:hover:scale-[1.02] motion-reduce:transition-none"
                sizes="(min-width: 1024px) 42vw, (min-width: 640px) 70vw, 100vw"
                priority={false}
              />
            </div>
            <div className="absolute -bottom-2 right-0 w-3/4 border-8 border-surface-muted bg-surface shadow-lg sm:w-2/3">
              <div className="aspect-video overflow-hidden">
                <Image
                  src={aboutConnectionImage}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 ease-out supports-[hover:hover]:hover:scale-[1.02] motion-reduce:transition-none"
                  sizes="(min-width: 1024px) 28vw, (min-width: 640px) 46vw, 72vw"
                />
              </div>
            </div>
          </div>
        </div>

        {/* our mission */}

        <div className="mt-16  sm:mt-24">
          <div className="flex-1 md:grid md:grid-cols-2 md:gap-8 lg:grid lg:gap-16 ">
            <div className="flex flex-col justify-center  py-10 md:order-2 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
              <p className="kclub-section-eyebrow">{t('about.mission.eyebrow')}</p>
              <h3 className="mt-5 text-2xl font-semibold text-foreground sm:text-3xl">
                {t('about.mission.title')}
              </h3>
              <p className="kclub-section-copy mt-5">{t('about.mission.description')}</p>
            </div>
            <div className="relative min-h-64 overflow-hidden md:order-1 sm:min-h-80 lg:min-h-full">
              <Image
                src={aboutMissionImage}
                alt={t('about.mission.title')}
                className="object-cover transition-transform duration-300 ease-out supports-[hover:hover]:hover:scale-[1.02] motion-reduce:transition-none"
                sizes="(min-width: 1024px) 50vw, 100vw"
                fill
              />
            </div>
          </div>
        </div>

        <div className="mt-16 sm:mt-24">
          <p className="kclub-section-eyebrow">{t('about.audiences.eyebrow')}</p>
          <h3 className="mt-5 max-w-4xl text-2xl font-semibold text-foreground sm:text-3xl">
            {t('about.audiences.title')}
          </h3>
          <ul className="mt-8 grid gap-6 lg:grid-cols-3">
            <li>
              <AudienceCard
                title={t('about.audiences.members.title')}
                description={t('about.audiences.members.description')}
                image={aboutMemberImage}
              />
            </li>
            <li>
              <AudienceCard
                title={t('about.audiences.professionals.title')}
                description={t('about.audiences.professionals.description')}
                image={aboutProfessionalImage}
              />
            </li>
            <li>
              <AudienceCard
                title={t('about.audiences.companies.title')}
                description={t('about.audiences.companies.description')}
                image={aboutCompaniesImage}
              />
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function AudienceCard({ title, description, image }: AudienceCardProps): React.ReactElement {
  return (
    <Surface className="group h-full max-w-none overflow-hidden rounded-none p-0 shadow-none">
      <div className="aspect-video overflow-hidden bg-surface-muted">
        <Image
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 ease-out supports-[hover:hover]:group-hover:scale-[1.03] motion-reduce:transition-none"
          sizes="(min-width: 1024px) 31vw, (min-width: 640px) 70vw, 100vw"
        />
      </div>
      <div className="pt-6">
        <h4 className="text-xl font-semibold text-foreground">{title}</h4>
        <p className="mt-3 kclub-section-copy leading-6 text-muted-foreground">{description}</p>
      </div>
    </Surface>
  );
}
