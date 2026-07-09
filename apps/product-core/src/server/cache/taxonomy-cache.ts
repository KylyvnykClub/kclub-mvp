import { unstable_cache } from 'next/cache';

import {
  listCategories as fetchCategories,
  listCountries as fetchCountries,
  listCities as fetchCities,
} from '@/server/services/admin-service';

export const getCachedCategories = unstable_cache(async () => fetchCategories(), ['categories'], {
  revalidate: 3600,
  tags: ['taxonomy', 'categories'],
});

export const getCachedCountries = unstable_cache(async () => fetchCountries(), ['countries'], {
  revalidate: 3600,
  tags: ['taxonomy', 'countries'],
});

export const getCachedCities = unstable_cache(async () => fetchCities(), ['cities'], {
  revalidate: 3600,
  tags: ['taxonomy', 'cities'],
});
