import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { ERROR_CODES } from '@kclub/contracts';

import { jsonError } from '@/server/api/response';

type StaffAuthRateLimitScope =
  'password-register' | 'password-sign-in' | 'totp-setup' | 'totp-verify';

type StaffAuthRateLimitConfig = {
  limit: number;
  prefix: string;
  window: `${number} ${'s' | 'm' | 'h'}`;
};

type StaffAuthRateLimitResult = {
  limit: number;
  remaining: number;
  reset: number;
  success: boolean;
};

type StaffAuthLimiter = {
  limit: (identifier: string) => Promise<StaffAuthRateLimitResult>;
};

const STAFF_AUTH_RATE_LIMITS: Record<StaffAuthRateLimitScope, StaffAuthRateLimitConfig> = {
  'password-register': { prefix: 'staff-auth-password-register', limit: 3, window: '15 m' },
  'password-sign-in': { prefix: 'staff-auth-password-sign-in', limit: 5, window: '15 m' },
  'totp-setup': { prefix: 'staff-auth-totp-setup', limit: 3, window: '15 m' },
  'totp-verify': { prefix: 'staff-auth-totp-verify', limit: 8, window: '10 m' },
};

let redisClient: Redis | null | undefined;
const limiterCache = new Map<StaffAuthRateLimitScope, StaffAuthLimiter | null>();
const limiterOverrides = new Map<StaffAuthRateLimitScope, StaffAuthLimiter | null>();

function isConfiguredEnvValue(value: string | undefined): value is string {
  if (!value || value.trim() === '') return false;
  if (value.includes('REPLACE_ME')) return false;
  return true;
}

function shouldRequireStaffAuthRateLimits(): boolean {
  return (
    process.env.STAFF_AUTH_RATE_LIMIT_REQUIRED === 'true' || process.env.NODE_ENV === 'production'
  );
}

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!isConfiguredEnvValue(url) || !isConfiguredEnvValue(token)) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

function getLimiter(scope: StaffAuthRateLimitScope): StaffAuthLimiter | null {
  if (limiterOverrides.has(scope)) {
    return limiterOverrides.get(scope) ?? null;
  }

  if (limiterCache.has(scope)) {
    return limiterCache.get(scope) ?? null;
  }

  const client = getRedisClient();
  if (!client) {
    limiterCache.set(scope, null);
    return null;
  }

  const config = STAFF_AUTH_RATE_LIMITS[scope];
  const limiter = new Ratelimit({
    redis: client,
    prefix: `rl:${config.prefix}`,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
  });

  limiterCache.set(scope, limiter);
  return limiter;
}

function getRetryAfterSeconds(reset: number): string {
  return String(Math.max(1, Math.ceil(reset / 1000 - Date.now() / 1000)));
}

export function buildPhoneRateLimitIdentifier(phone: string, ipAddress: string | null): string {
  return `${normalizePhone(phone)}:${ipAddress ?? 'unknown-ip'}`;
}

export function buildActorRateLimitIdentifier(actorId: string, ipAddress: string | null): string {
  return `${actorId}:${ipAddress ?? 'unknown-ip'}`;
}

export function getRequestIpAddress(request: Request): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null
  );
}

export async function checkStaffAuthRateLimit(
  scope: StaffAuthRateLimitScope,
  identifier: string,
): Promise<Response | null> {
  const limiter = getLimiter(scope);

  if (!limiter) {
    if (!shouldRequireStaffAuthRateLimits()) {
      return null;
    }

    return jsonError(
      {
        code: ERROR_CODES.SERVER_DEPENDENCY_UNAVAILABLE,
        message: 'Staff auth rate limiting is unavailable',
      },
      undefined,
      { status: 503 },
    );
  }

  try {
    const result = await limiter.limit(identifier);
    if (result.success) {
      return null;
    }

    return jsonError(
      {
        code: ERROR_CODES.RATE_LIMITED,
        message: 'Too many requests',
      },
      undefined,
      {
        status: 429,
        headers: {
          'Retry-After': getRetryAfterSeconds(result.reset),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
        },
      },
    );
  } catch {
    return jsonError(
      {
        code: ERROR_CODES.SERVER_DEPENDENCY_UNAVAILABLE,
        message: 'Staff auth rate limiting is unavailable',
      },
      undefined,
      { status: 503 },
    );
  }
}

export function __setStaffAuthRateLimiterForTests(
  scope: StaffAuthRateLimitScope,
  limiter: StaffAuthLimiter | null,
): void {
  limiterOverrides.set(scope, limiter);
}

export function __resetStaffAuthRateLimitersForTests(): void {
  limiterOverrides.clear();
  limiterCache.clear();
  redisClient = undefined;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '').trim();
}
