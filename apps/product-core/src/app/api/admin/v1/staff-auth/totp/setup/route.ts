import { ERROR_CODES } from '@kclub/contracts';

import { getBearerToken, getStaffSession } from '@/server/staff-auth';
import { hasVerifiedTotp, setupTotp } from '@/server/staff-totp';

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

  const alreadyVerified = await hasVerifiedTotp(profile.id);
  if (alreadyVerified) {
    return Response.json(
      {
        data: null,
        error: { code: ERROR_CODES.RESOURCE_CONFLICT, message: 'TOTP already configured' },
      },
      { status: 409 },
    );
  }

  const { uri, backupCodes } = await setupTotp(profile.id, profile.phone);

  return Response.json({ data: { totpUri: uri, backupCodes }, error: null });
}
