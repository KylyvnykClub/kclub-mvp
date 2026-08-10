import { describe, expect, test } from 'vitest';

import { parseAdminConfigPriceId, resolveStripePriceIdFromEnv } from '@/server/stripe/price-config';

describe('stripe price config', () => {
  test('resolveStripePriceIdFromEnv reads fallback env names', () => {
    const previousVip = process.env.STRIPE_PRICE_VIP;
    const previousBusiness = process.env.STRIPE_PRICE_BUSINESS;

    process.env.STRIPE_PRICE_VIP = 'price_vip_test';
    process.env.STRIPE_PRICE_BUSINESS = 'price_business_test';

    expect(resolveStripePriceIdFromEnv('stripe_price_vip_membership_monthly')).toBe(
      'price_vip_test',
    );
    expect(resolveStripePriceIdFromEnv('stripe_price_business_placement_monthly')).toBe(
      'price_business_test',
    );

    if (previousVip === undefined) {
      delete process.env.STRIPE_PRICE_VIP;
    } else {
      process.env.STRIPE_PRICE_VIP = previousVip;
    }

    if (previousBusiness === undefined) {
      delete process.env.STRIPE_PRICE_BUSINESS;
    } else {
      process.env.STRIPE_PRICE_BUSINESS = previousBusiness;
    }
  });

  test('parseAdminConfigPriceId reads admin_config value shape', () => {
    expect(parseAdminConfigPriceId('price_string')).toBe('price_string');
    expect(parseAdminConfigPriceId({ priceId: 'price_admin' })).toBe('price_admin');
    expect(parseAdminConfigPriceId({ stripePriceId: 'price_legacy' })).toBeUndefined();
    expect(parseAdminConfigPriceId({ priceId: '   ' })).toBeUndefined();
  });
});
