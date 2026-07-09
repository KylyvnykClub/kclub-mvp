import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

let redis: Redis | null = null;

function isConfiguredEnvValue(value: string | undefined): value is string {
  if (!value || value.trim() === '') return false;
  if (value.includes('REPLACE_ME')) return false;
  return true;
}

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!isConfiguredEnvValue(url) || !isConfiguredEnvValue(token)) return null;
  redis = new Redis({ url, token });
  return redis;
}

export function createRateLimiter(opts: {
  prefix: string;
  limit: number;
  window: `${number} ${'s' | 'm' | 'h'}`;
}) {
  const client = getRedis();
  if (!client) return null;

  return new Ratelimit({
    redis: client,
    prefix: `rl:${opts.prefix}`,
    limiter: Ratelimit.slidingWindow(opts.limit, opts.window),
  });
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<NextResponse | null> {
  if (!limiter) return null;

  const result = await limiter.limit(identifier);
  if (result.success) return null;

  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(result.reset / 1000 - Date.now() / 1000)),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    },
  );
}

export const authLimiter = createRateLimiter({ prefix: 'auth', limit: 5, window: '1 m' });
export const apiLimiter = createRateLimiter({ prefix: 'api', limit: 30, window: '1 m' });
