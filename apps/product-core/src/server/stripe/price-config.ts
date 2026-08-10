const STRIPE_PRICE_ENV_BY_CONFIG_KEY: Record<string, readonly string[]> = {
  stripe_price_vip_membership_monthly: [
    'STRIPE_PRICE_VIP_MEMBERSHIP_MONTHLY',
    'STRIPE_PRICE_VIP',
  ],
  stripe_price_business_placement_monthly: [
    'STRIPE_PRICE_BUSINESS_PLACEMENT_MONTHLY',
    'STRIPE_PRICE_BUSINESS',
  ],
};

export function resolveStripePriceIdFromEnv(configKey: string): string | undefined {
  for (const envKey of STRIPE_PRICE_ENV_BY_CONFIG_KEY[configKey] ?? []) {
    const value = process.env[envKey]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function parseAdminConfigPriceId(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const priceId = value.trim();
    return priceId || undefined;
  }

  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const candidate = value as { priceId?: unknown };
  if (typeof candidate.priceId !== 'string') {
    return undefined;
  }

  const priceId = candidate.priceId.trim();
  return priceId || undefined;
}
