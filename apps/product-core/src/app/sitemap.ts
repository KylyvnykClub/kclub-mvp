import type { MetadataRoute } from 'next';

import { locales } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.kylyvnyk.club';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ['', '/directory'];
  const staticEntries = staticRoutes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1.0 : 0.8,
    })),
  );

  let businessEntries: MetadataRoute.Sitemap = [];
  try {
    const { getPublicBusinesses } = await import('@/server/services/business-service');
    const businesses = await getPublicBusinesses();
    businessEntries = businesses.flatMap((business) =>
      locales.map((locale) => ({
        url: `${BASE_URL}/${locale}/directory/${business.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    );
  } catch {}

  return [...staticEntries, ...businessEntries];
}
