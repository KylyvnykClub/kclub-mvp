import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  ADMIN_BOOTSTRAP_PLAN,
  CATEGORY_SEED_PLAN,
  CONFIG_SEED_PLAN,
  COUNTRY_SEED_PLAN,
  GENERATED_DATABASE_TYPES_COMMAND,
  GENERATED_DATABASE_TYPES_PATH,
} from '../src';

const migrationPath = resolve(
  import.meta.dir,
  '../prisma/migrations/20260614120000_init/migration.sql',
);
const schemaPath = resolve(import.meta.dir, '../prisma/schema.prisma');

describe('database package contracts', () => {
  test('exports generated types placeholder metadata', () => {
    expect(GENERATED_DATABASE_TYPES_PATH).toBe('packages/database/src/generated/client');
    expect(GENERATED_DATABASE_TYPES_COMMAND).toBe('bun --filter @kclub/database db:generate');
  });

  test('contains a seed plan with high-risk categories and bootstrap config', () => {
    expect(COUNTRY_SEED_PLAN.length).toBeGreaterThan(0);
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

  test('migration SQL includes required integrity constraints and featured reset behavior', () => {
    const migration = readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('member_cards_one_active_card_per_user_idx');
    expect(migration).toContain('business_profiles_one_active_non_rejected_per_user_idx');
    expect(migration).toContain('event_id VARCHAR(255) NOT NULL UNIQUE');
    expect(migration).toContain('CREATE TRIGGER business_profiles_reset_featured_flags');
    expect(migration).toContain("CHECK (card_number ~ '^(MEM|VIP)-[0-9]{6}$')");
  });

  test('prisma schema contains all MVP table models', () => {
    const schema = readFileSync(schemaPath, 'utf8');

    for (const modelName of [
      'model User',
      'model MemberCard',
      'model VipSubscription',
      'model Subscription',
      'model BusinessProfile',
      'model BusinessIntroduction',
      'model Category',
      'model Country',
      'model City',
      'model AdminUser',
      'model Admin2FA',
      'model AdminSession',
      'model AuditLog',
      'model AdminConfig',
      'model StripeWebhookEvent',
    ]) {
      expect(schema).toContain(modelName);
    }
  });
});
