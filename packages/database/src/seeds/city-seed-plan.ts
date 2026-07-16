import allCitySeedData from './all-city-seed-data.json';
import type { CitySeedPlan } from './seed-plan.js';

type CitySeedRow = readonly [countrySlug: string, name: string, slug: string];

// Generated from country-state-city@3.2.1 and normalized to the local seed shape.
const citySeedRows = allCitySeedData as unknown as readonly CitySeedRow[];

export const IMPORTED_CITY_SEED_PLAN: readonly CitySeedPlan[] = citySeedRows.map(
  ([countrySlug, name, slug]) => ({
    countrySlug,
    name,
    slug,
  }),
);
