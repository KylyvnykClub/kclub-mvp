import { ERROR_CODES } from '@kclub/contracts';
import { totpCodeSchema } from '@kclub/validation';

import { getBearerToken, getStaffSession } from '@/server/staff-auth';
import {
  buildActorRateLimitIdentifier,
  checkStaffAuthRateLimit,
  getRequestIpAddress,
} from '@/server/staff-auth-rate-limit';
import { hasVerifiedTotp, verifyAndActivateTotp, verifyTotpCode } from '@/server/staff-totp';

export async function POST(request: Request): Promise<Response> {
  const token = getBearerToken(request);
  if (!token) {
    return Response.json(
      {
        data: null,
        error: { code: ERROR_CODES.AUTH_SESSION_REQUIRED, message: 'Session required' },
      },
      { status: 401 },
    );
  }

  const profile = await getStaffSession(token);
  if (!profile) {
    return Response.json(
      { data: null, error: { code: ERROR_CODES.AUTH_SESSION_INVALID, message: 'Invalid session' } },
      { status: 401 },
    );
  }

  const rateLimitResponse = await checkStaffAuthRateLimit(
    'totp-verify',
    buildActorRateLimitIdentifier(profile.id, getRequestIpAddress(request)),
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const body = await request.json().catch(() => null);
  const parsed = totpCodeSchema.safeParse(body?.code);
  if (!parsed.success) {
    return Response.json(
      {
        data: null,
        error: {
          code: ERROR_CODES.VALIDATION_INVALID_INPUT,
          message: 'Valid 6-digit code required',
        },
      },
      { status: 400 },
    );
  }

  const alreadyVerified = await hasVerifiedTotp(profile.id);

  const isValid = alreadyVerified
    ? await verifyTotpCode(profile.id, parsed.data)
    : await verifyAndActivateTotp(profile.id, parsed.data);

  if (!isValid) {
    return Response.json(
      {
        data: null,
        error: { code: ERROR_CODES.AUTH_STAFF_2FA_REQUIRED, message: 'Invalid TOTP code' },
      },
      { status: 401 },
    );
  }

  return Response.json({ data: { verified: true }, error: null });
}
