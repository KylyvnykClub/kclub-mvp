import { describe, expect, test } from 'vitest';
import { getTableName, is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  ADMIN_BOOTSTRAP_PLAN,
  CATEGORY_SEED_PLAN,
  CITY_SEED_PLAN,
  CONFIG_SEED_PLAN,
  COUNTRY_SEED_PLAN,
  schema,
} from '../src';
import { IMPORTED_CITY_SEED_PLAN } from '../src/seeds/city-seed-plan';

const migrationPath = resolve(import.meta.dirname, '../drizzle/0000_sharp_vulcan.sql');

const MVP_TABLES = [
  'users',
  'member_cards',
  'vip_subscriptions',
  'subscriptions',
  'business_profiles',
  'business_introductions',
  'categories',
  'countries',
  'cities',
  'admin_users',
  'admin_2fa',
  'admin_sessions',
  'audit_logs',
  'admin_config',
  'stripe_webhook_events',
] as const;

describe('database package contracts', () => {
  test('contains a seed plan with high-risk categories and bootstrap config', () => {
    expect(COUNTRY_SEED_PLAN.length).toBeGreaterThanOrEqual(240);
    expect(IMPORTED_CITY_SEED_PLAN.length).toBeGreaterThanOrEqual(100_000);
    expect(CITY_SEED_PLAN.length).toBeGreaterThanOrEqual(IMPORTED_CITY_SEED_PLAN.length);
    expect(COUNTRY_SEED_PLAN.map((country) => country.name)).toEqual(
      expect.arrayContaining([
        'Belgium',
        'Brazil',
        'China',
        'Monaco',
        'Switzerland',
        'Ukraine',
        'United Arab Emirates',
        'United Kingdom',
        'United States',
      ]),
    );
    expect(CITY_SEED_PLAN.map((city) => `${city.countrySlug}:${city.slug}`)).toEqual(
      expect.arrayContaining([
        'belgium:antwerp',
        'belgium:brussels',
        'brazil:brasilia',
        'brazil:rio-de-janeiro',
        'brazil:sao-paulo',
        'china:beijing',
        'china:guangzhou',
        'china:shanghai',
        'china:shenzhen',
        'switzerland:zurich',
        'united-arab-emirates:abu-dhabi',
      ]),
    );
    for (const country of COUNTRY_SEED_PLAN) {
      const citySlugs = CITY_SEED_PLAN.filter((city) => city.countrySlug === country.slug).map(
        (city) => city.slug,
      );
      expect(citySlugs).toEqual(expect.arrayContaining([...country.citySlugs]));
    }
    expect(CATEGORY_SEED_PLAN.some((category) => category.isHighRisk)).toBe(true);
    expect(
      CATEGORY_SEED_PLAN.filter((category) => category.isHighRisk).map((category) => category.slug),
    ).toEqual(
      expect.arrayContaining([
        'crypto',
        'gambling',
        'adult',
        'firearms',
        'unlicensed-financial',
        'high-risk-investments',
      ]),
    );
    expect(ADMIN_BOOTSTRAP_PLAN.ownerAccountRequired).toBe(true);
    expect(ADMIN_BOOTSTRAP_PLAN.ownerPhoneEnv).toBe('ADMIN_BOOTSTRAP_OWNER_PHONE');
    expect(CONFIG_SEED_PLAN.stripePriceKeys).toContain('stripe_price_vip_membership_monthly');
  });

  test('baseline migration creates every MVP table and webhook idempotency constraint', () => {
    const migration = readFileSync(migrationPath, 'utf8');

    for (const tableName of MVP_TABLES) {
      expect(migration).toContain(`CREATE TABLE "${tableName}"`);
    }
    expect(migration).toMatch(/event_id_unique" UNIQUE/);
  });

  test('business profile brief description schema and migration allow 2000 chars', () => {
    const migration = readFileSync(
      resolve(import.meta.dirname, '../drizzle/0006_business_brief_description_length.sql'),
      'utf8',
    );

    expect(migration).toContain(
      'ALTER TABLE "business_profiles" ALTER COLUMN "brief_description" SET DATA TYPE varchar(2000);',
    );
    expect(schema.businessProfiles.brief_description.getSQLType()).toBe('varchar(2000)');
  });

  test('drizzle schema exports a table object for every MVP table', () => {
    const exportedTables = new Set(
      Object.values(schema)
        .filter((value) => is(value, PgTable))
        .map((table) => getTableName(table)),
    );

    for (const tableName of MVP_TABLES) {
      expect(exportedTables.has(tableName)).toBe(true);
    }
  });
});
