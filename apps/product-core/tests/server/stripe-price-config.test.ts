import { describe, expect, test } from 'bun:test';

import { parseAdminConfigPriceId, resolveStripePriceIdFromEnv } from '@/server/stripe/price-config';

describe('stripe price config', () => {
  test('resolveStripePriceIdFromEnv reads legacy annual env names', () => {
    const previousVip = process.env.STRIPE_PRICE_VIP_ANNUAL;
    const previousBusiness = process.env.STRIPE_PRICE_BUSINESS_ANNUAL;

    process.env.STRIPE_PRICE_VIP_ANNUAL = 'price_vip_test';
    process.env.STRIPE_PRICE_BUSINESS_ANNUAL = 'price_business_test';

    expect(resolveStripePriceIdFromEnv('stripe_price_vip_membership_monthly')).toBe(
      'price_vip_test',
    );
    expect(resolveStripePriceIdFromEnv('stripe_price_business_placement_monthly')).toBe(
      'price_business_test',
    );

    if (previousVip === undefined) {
      delete process.env.STRIPE_PRICE_VIP_ANNUAL;
    } else {
      process.env.STRIPE_PRICE_VIP_ANNUAL = previousVip;
    }

    if (previousBusiness === undefined) {
      delete process.env.STRIPE_PRICE_BUSINESS_ANNUAL;
    } else {
      process.env.STRIPE_PRICE_BUSINESS_ANNUAL = previousBusiness;
    }
  });

  test('parseAdminConfigPriceId reads admin_config value shape', () => {
    expect(parseAdminConfigPriceId({ priceId: 'price_admin' })).toBe('price_admin');
    expect(parseAdminConfigPriceId({ stripePriceId: 'price_legacy' })).toBeUndefined();
    expect(parseAdminConfigPriceId({ priceId: '   ' })).toBeUndefined();
  });
});
