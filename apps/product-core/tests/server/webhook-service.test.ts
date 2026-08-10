import { describe, expect, test } from 'vitest';

import {
  isLiveModeConfigured,
  mapStripeStatusToLocal,
  readInvoiceSubscriptionId,
  readSubscriptionPeriod,
  validatePlacementCheckout,
} from '../../src/server/services/webhook-service';
import { validateBusinessReviewReservePaymentIntent } from '../../src/server/services/business-service';

describe('mapStripeStatusToLocal', () => {
  const futurePeriodEnd = Math.floor(Date.now() / 1000) + 86400 * 30;
  const pastPeriodEnd = Math.floor(Date.now() / 1000) - 86400;

  test('active maps to ACTIVE', () => {
    expect(mapStripeStatusToLocal('active', null)).toBe('ACTIVE');
  });

  test('trialing maps to ACTIVE', () => {
    expect(mapStripeStatusToLocal('trialing', null)).toBe('ACTIVE');
    expect(mapStripeStatusToLocal('trialing', futurePeriodEnd)).toBe('ACTIVE');
  });

  test('past_due maps to PAST_DUE', () => {
    expect(mapStripeStatusToLocal('past_due', futurePeriodEnd)).toBe('PAST_DUE');
    expect(mapStripeStatusToLocal('past_due', null)).toBe('PAST_DUE');
  });

  test('unpaid maps to PAST_DUE', () => {
    expect(mapStripeStatusToLocal('unpaid', null)).toBe('PAST_DUE');
  });

  test('incomplete maps to PAST_DUE', () => {
    expect(mapStripeStatusToLocal('incomplete', null)).toBe('PAST_DUE');
  });

  test('incomplete_expired maps to PAST_DUE', () => {
    expect(mapStripeStatusToLocal('incomplete_expired', null)).toBe('PAST_DUE');
  });

  test('canceled with future current_period_end maps to CANCELED', () => {
    expect(mapStripeStatusToLocal('canceled', futurePeriodEnd)).toBe('CANCELED');
  });

  test('canceled with past or null current_period_end maps to EXPIRED', () => {
    expect(mapStripeStatusToLocal('canceled', pastPeriodEnd)).toBe('EXPIRED');
    expect(mapStripeStatusToLocal('canceled', null)).toBe('EXPIRED');
  });

  test('unknown status returns null', () => {
    expect(mapStripeStatusToLocal('unknown_status', null)).toBeNull();
    expect(mapStripeStatusToLocal('paused', null)).toBeNull();
  });
});

describe('validatePlacementCheckout', () => {
  const validMetadata = { userId: 'user-1', businessId: 'bus-1' };
  const approvedBusiness = { status: 'APPROVED' as const, user_id: 'user-1' };
  const activeVipSub = { status: 'ACTIVE' as const };

  test('returns VALID for valid placement checkout', () => {
    const result = validatePlacementCheckout(validMetadata, approvedBusiness, activeVipSub);
    expect(result).toBe('VALID');
  });

  test('throws when metadata is missing userId', () => {
    expect(() =>
      validatePlacementCheckout({ businessId: 'bus-1' }, approvedBusiness, activeVipSub),
    ).toThrow('missing userId or businessId');
  });

  test('throws when metadata is missing businessId', () => {
    expect(() =>
      validatePlacementCheckout({ userId: 'user-1' }, approvedBusiness, activeVipSub),
    ).toThrow('missing userId or businessId');
  });

  test('throws when business not found', () => {
    expect(() => validatePlacementCheckout(validMetadata, null, activeVipSub)).toThrow(
      'Business not found',
    );
  });

  test('throws when business owner does not match metadata userId', () => {
    const wrongOwnerBusiness = { status: 'APPROVED' as const, user_id: 'user-2' };
    expect(() =>
      validatePlacementCheckout(validMetadata, wrongOwnerBusiness, activeVipSub),
    ).toThrow('owner mismatch');
  });

  test('returns ALREADY_PUBLISHED when business is PUBLISHED with matching placement subscription', () => {
    const publishedBusiness = { status: 'PUBLISHED' as const, user_id: 'user-1' };
    const existingSub = { kind: 'BUSINESS_PLACEMENT', stripe_subscription_id: 'sub_00000001' };
    const result = validatePlacementCheckout(
      validMetadata,
      publishedBusiness,
      activeVipSub,
      existingSub,
      'sub_00000001',
    );
    expect(result).toBe('ALREADY_PUBLISHED');
  });

  test('throws when business is PUBLISHED without matching subscription', () => {
    const publishedBusiness = { status: 'PUBLISHED' as const, user_id: 'user-1' };
    expect(() => validatePlacementCheckout(validMetadata, publishedBusiness, activeVipSub)).toThrow(
      'no matching placement subscription',
    );
  });

  test('throws when business is PUBLISHED with mismatched subscription id', () => {
    const publishedBusiness = { status: 'PUBLISHED' as const, user_id: 'user-1' };
    const existingSub = { kind: 'BUSINESS_PLACEMENT', stripe_subscription_id: 'sub_other' };
    expect(() =>
      validatePlacementCheckout(
        validMetadata,
        publishedBusiness,
        activeVipSub,
        existingSub,
        'sub_new',
      ),
    ).toThrow('no matching placement subscription');
  });

  test('throws when business is not APPROVED', () => {
    const underReviewBusiness = { status: 'UNDER_REVIEW' as const, user_id: 'user-1' };
    expect(() =>
      validatePlacementCheckout(validMetadata, underReviewBusiness, activeVipSub),
    ).toThrow('UNDER_REVIEW');
  });

  test('throws when business is REJECTED', () => {
    const rejectedBusiness = { status: 'REJECTED' as const, user_id: 'user-1' };
    expect(() => validatePlacementCheckout(validMetadata, rejectedBusiness, activeVipSub)).toThrow(
      'REJECTED',
    );
  });

  test('allows re-publish when business is HIDDEN', () => {
    const hiddenBusiness = { status: 'HIDDEN' as const, user_id: 'user-1' };
    expect(validatePlacementCheckout(validMetadata, hiddenBusiness, activeVipSub)).toBe('VALID');
  });

  test('throws when no VIP subscription exists', () => {
    expect(() => validatePlacementCheckout(validMetadata, approvedBusiness, null)).toThrow(
      'active VIP access',
    );
  });

  test('throws when VIP subscription is EXPIRED', () => {
    const expiredVipSub = { status: 'EXPIRED' as const };
    expect(() => validatePlacementCheckout(validMetadata, approvedBusiness, expiredVipSub)).toThrow(
      'active VIP access',
    );
  });

  test('throws when VIP subscription is NONE', () => {
    const noneVipSub = { status: 'NONE' as const };
    expect(() => validatePlacementCheckout(validMetadata, approvedBusiness, noneVipSub)).toThrow(
      'active VIP access',
    );
  });

  test('accepts CANCELED VIP subscription (grace period)', () => {
    const canceledVipSub = { status: 'CANCELED' as const };
    const result = validatePlacementCheckout(validMetadata, approvedBusiness, canceledVipSub);
    expect(result).toBe('VALID');
  });

  test('accepts PAST_DUE VIP subscription', () => {
    const pastDueVipSub = { status: 'PAST_DUE' as const };
    const result = validatePlacementCheckout(validMetadata, approvedBusiness, pastDueVipSub);
    expect(result).toBe('VALID');
  });
});

describe('validateBusinessReviewReservePaymentIntent', () => {
  const metadata = {
    type: 'business_review_reserve',
    userId: 'user-1',
    pendingSubmissionId: 'pending-1',
  };

  test('returns pending submission id for a valid authorization', () => {
    expect(validateBusinessReviewReservePaymentIntent(metadata, 1999)).toBe('pending-1');
  });

  test('throws when metadata does not identify a business review reserve', () => {
    expect(() =>
      validateBusinessReviewReservePaymentIntent({ ...metadata, type: 'other' }, 1999),
    ).toThrow('missing business review metadata');
  });

  test('throws when authorized amount is lower than required reserve', () => {
    expect(() => validateBusinessReviewReservePaymentIntent(metadata, 1998)).toThrow(
      'below the required authorization',
    );
  });
});

describe('isLiveModeConfigured', () => {
  test('true only for a live secret key', () => {
    expect(isLiveModeConfigured({ STRIPE_SECRET_KEY: 'sk_live_abc' })).toBe(true);
    expect(isLiveModeConfigured({ STRIPE_SECRET_KEY: 'sk_test_abc' })).toBe(false);
    expect(isLiveModeConfigured({})).toBe(false);
  });
});

describe('readSubscriptionPeriod', () => {
  test('reads the boundary from the first subscription item', () => {
    const subscription = {
      items: { data: [{ current_period_start: 100, current_period_end: 200 }] },
    };
    expect(readSubscriptionPeriod(subscription, 'current_period_start')).toBe(100);
    expect(readSubscriptionPeriod(subscription, 'current_period_end')).toBe(200);
  });

  test('falls back to the legacy top-level field', () => {
    expect(readSubscriptionPeriod({ current_period_end: 300 }, 'current_period_end')).toBe(300);
  });

  test('prefers the item over the legacy field', () => {
    const subscription = {
      current_period_end: 300,
      items: { data: [{ current_period_end: 200 }] },
    };
    expect(readSubscriptionPeriod(subscription, 'current_period_end')).toBe(200);
  });

  test('returns null when the boundary is absent or not numeric', () => {
    expect(readSubscriptionPeriod({}, 'current_period_end')).toBeNull();
    expect(readSubscriptionPeriod({ current_period_end: null }, 'current_period_end')).toBeNull();
    expect(readSubscriptionPeriod({ items: { data: [] } }, 'current_period_end')).toBeNull();
  });
});

describe('readInvoiceSubscriptionId', () => {
  test('reads the id from parent.subscription_details', () => {
    expect(
      readInvoiceSubscriptionId({
        parent: { subscription_details: { subscription: 'sub_1' } },
      }),
    ).toBe('sub_1');
  });

  test('unwraps an expanded subscription object', () => {
    expect(
      readInvoiceSubscriptionId({
        parent: { subscription_details: { subscription: { id: 'sub_2' } } },
      }),
    ).toBe('sub_2');
  });

  test('falls back to the legacy top-level field', () => {
    expect(readInvoiceSubscriptionId({ subscription: 'sub_3' })).toBe('sub_3');
    expect(readInvoiceSubscriptionId({ parent: null, subscription: 'sub_3' })).toBe('sub_3');
  });

  test('returns null for a one-off invoice', () => {
    expect(readInvoiceSubscriptionId({})).toBeNull();
    expect(readInvoiceSubscriptionId({ parent: { subscription_details: null } })).toBeNull();
  });
});

describe('processStripeEvent with mocked handler', () => {
  test('verify export exists and is callable', async () => {
    const { processStripeEvent } = await import('../../src/server/services/webhook-service');
    expect(processStripeEvent).toBeInstanceOf(Function);
  });
});
