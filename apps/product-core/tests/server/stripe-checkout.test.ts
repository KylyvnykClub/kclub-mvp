import { describe, expect, test } from 'bun:test';

import {
  buildVipMetadata,
  buildPlacementMetadata,
  buildSuccessUrl,
  buildCancelUrl,
} from '../../src/server/services/subscription-service';

describe('buildVipMetadata', () => {
  test('returns type vip and userId', () => {
    const meta = buildVipMetadata('user-1');
    expect(meta).toEqual({
      type: 'vip',
      userId: 'user-1',
    });
  });

  test('does not include businessId', () => {
    const meta = buildVipMetadata('user-2');
    expect(meta).not.toHaveProperty('businessId');
  });
});

describe('buildPlacementMetadata', () => {
  test('returns type business_placement, userId, and businessId', () => {
    const meta = buildPlacementMetadata('user-1', 'bus-1');
    expect(meta).toEqual({
      type: 'business_placement',
      userId: 'user-1',
      businessId: 'bus-1',
    });
  });
});

describe('buildSuccessUrl', () => {
  test('uses appUrl, locale, and CHECKOUT_SESSION_ID placeholder', () => {
    const url = buildSuccessUrl('https://example.com', 'en');
    expect(url).toBe('https://example.com/en/m/checkout/success?session_id={CHECKOUT_SESSION_ID}');
  });

  test('works with different locale', () => {
    const url = buildSuccessUrl('https://example.com', 'uk');
    expect(url).toBe('https://example.com/uk/m/checkout/success?session_id={CHECKOUT_SESSION_ID}');
  });

  test('strips trailing locale prefix from appUrl', () => {
    const url = buildSuccessUrl('https://example.com/en', 'en');
    expect(url).toBe('https://example.com/en/m/checkout/success?session_id={CHECKOUT_SESSION_ID}');
  });

  test('strips trailing slash from appUrl', () => {
    const url = buildSuccessUrl('https://example.com/', 'en');
    expect(url).toBe('https://example.com/en/m/checkout/success?session_id={CHECKOUT_SESSION_ID}');
  });

  test('strips trailing slash and locale prefix from appUrl', () => {
    const url = buildSuccessUrl('https://example.com/ru/', 'en');
    expect(url).toBe('https://example.com/en/m/checkout/success?session_id={CHECKOUT_SESSION_ID}');
  });
});

describe('buildCancelUrl', () => {
  test('uses appUrl and locale', () => {
    const url = buildCancelUrl('https://example.com', 'en');
    expect(url).toBe('https://example.com/en/m/checkout/cancel');
  });

  test('works with ru locale', () => {
    const url = buildCancelUrl('https://example.com', 'ru');
    expect(url).toBe('https://example.com/ru/m/checkout/cancel');
  });

  test('does not include session_id', () => {
    const url = buildCancelUrl('https://example.com', 'en');
    expect(url).not.toContain('session_id');
  });

  test('strips trailing locale prefix from appUrl', () => {
    const url = buildCancelUrl('https://example.com/uk', 'en');
    expect(url).toBe('https://example.com/en/m/checkout/cancel');
  });

  test('strips trailing slash from appUrl', () => {
    const url = buildCancelUrl('https://example.com/', 'ru');
    expect(url).toBe('https://example.com/ru/m/checkout/cancel');
  });
});
