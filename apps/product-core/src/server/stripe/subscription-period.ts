import type Stripe from 'stripe';

type StripeSubscriptionPeriod = {
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  currentPeriodEndTimestamp: number | null;
};

export function getStripeSubscriptionPeriod(
  subscriptionItem:
    Pick<Stripe.SubscriptionItem, 'current_period_start' | 'current_period_end'> | undefined,
): StripeSubscriptionPeriod {
  if (!subscriptionItem) {
    return {
      currentPeriodStart: null,
      currentPeriodEnd: null,
      currentPeriodEndTimestamp: null,
    };
  }

  return {
    currentPeriodStart: new Date(subscriptionItem.current_period_start * 1000),
    currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000),
    currentPeriodEndTimestamp: subscriptionItem.current_period_end,
  };
}
