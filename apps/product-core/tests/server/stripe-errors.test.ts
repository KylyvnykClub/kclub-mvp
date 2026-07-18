import { describe, expect, test } from 'vitest';
import Stripe from 'stripe';

import { ERROR_CODES } from '@kclub/contracts';

import { AppError } from '@/server/errors';
import { rethrowStripeCheckoutError } from '@/server/stripe/errors';

describe('rethrowStripeCheckoutError', () => {
  test('maps Stripe errors to checkout AppError', () => {
    const stripeError = new Stripe.errors.StripeInvalidRequestError({
      message: "No such price: 'price_missing'",
      type: 'invalid_request_error',
    });

    expect(() => rethrowStripeCheckoutError(stripeError)).toThrow(AppError);

    try {
      rethrowStripeCheckoutError(stripeError);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ERROR_CODES.CHECKOUT_CREATION_FAILED);
      expect((error as AppError).message).toBe("No such price: 'price_missing'");
    }
  });

  test('rethrows non-Stripe errors unchanged', () => {
    const genericError = new Error('db down');

    expect(() => rethrowStripeCheckoutError(genericError)).toThrow(genericError);
  });
});
