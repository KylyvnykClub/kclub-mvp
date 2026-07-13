import { getTranslations } from 'next-intl/server';

import { AboutSection } from '@/features/marketing/components/AboutSection';
import { CtaSection } from '@/features/marketing/components/CtaSection';
import { FaqSection } from '@/features/marketing/components/FaqSection';
import { FeaturedBusinesses } from '@/features/marketing/components/FeaturedBusinesses';
import { FeaturesSection } from '@/features/marketing/components/FeaturesSection';
import { HeroSection } from '@/features/marketing/components/HeroSection';
import { HowItWorksSection } from '@/features/marketing/components/HowItWorksSection';
import { PrinciplesSection } from '@/features/marketing/components/PrinciplesSection';
import { ServicesSection } from '@/features/marketing/components/ServicesSection';
import { StatsSection } from '@/features/marketing/components/StatsSection';
import { TestimonialsSection } from '@/features/marketing/components/TestimonialsSection';
import { TopPartnersSection } from '@/features/marketing/components/TopPartnersSection';
import { Locale } from '@/i18n/routing';
import { getCachedPublicBusinesses } from '@/server/cache/business-cache';

export const revalidate = 60;

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ru' }, { locale: 'uk' }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'publicSeo.home' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function Page(props: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await props.params;
  const businesses = await getCachedPublicBusinesses().catch(() => []);

  return (
    <>
      <HeroSection locale={locale} />
      <TopPartnersSection locale={locale} businesses={businesses} />
      <StatsSection />
      <AboutSection />
      <PrinciplesSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ServicesSection locale={locale} />
      <FeaturedBusinesses locale={locale} businesses={businesses} />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection locale={locale} />
    </>
  );
}
