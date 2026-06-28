import Stripe from 'stripe';

import { readStripeEnv } from './env';

let cachedStripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!cachedStripe) {
    const env = readStripeEnv();
    cachedStripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-06-24.dahlia',
    });
  }

  return cachedStripe;
}

export function resetStripeClientForTests(): void {
  cachedStripe = null;
}
