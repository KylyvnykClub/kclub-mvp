import {
  ERROR_CODES,
  type StaffPermission,
  type StaffRole,
  type StaffProfileDto,
} from '@kclub/contracts';
import { hasStaffPermission } from '@kclub/domain';
import { AppError } from '@/server/errors';
import { createRequestContext, type RequestContext } from '@/server/context';
import { createLogger } from '@/server/logger';
import { getBearerToken, getStaffSession } from '@/server/staff-auth';

export type AuthenticatedStaff = {
  profile: StaffProfileDto;
  token: string;
};

export async function authenticateStaff(request: Request): Promise<AuthenticatedStaff> {
  const token = getBearerToken(request);
  if (!token) {
    const log = createLogger();
    log.auth('Admin auth failed: missing bearer token');

    throw new AppError({
      code: ERROR_CODES.AUTH_SESSION_REQUIRED,
      message: 'Authorization bearer token is required',
      status: 401,
    });
  }

  const profile = await getStaffSession(token);
  if (!profile) {
    const log = createLogger();
    log.auth('Admin auth failed: invalid or expired session', {
      tokenPrefix: token.substring(0, 10),
    });

    throw new AppError({
      code: ERROR_CODES.AUTH_SESSION_INVALID,
      message: 'Staff session is invalid or expired',
      status: 401,
    });
  }

  if (!profile.totpVerified) {
    const log = createLogger();
    log.auth('Admin auth failed: TOTP not verified', { staffId: profile.id });

    throw new AppError({
      code: ERROR_CODES.AUTH_STAFF_2FA_REQUIRED,
      message: 'TOTP verification is required for admin access',
      status: 401,
    });
  }

  return { profile, token };
}

export function requireStaffPermission(
  profile: StaffProfileDto,
  permission: StaffPermission,
): void {
  if (!hasStaffPermission(profile.role as StaffRole, permission)) {
    const log = createLogger();
    log.auth('Admin permission denied', {
      staffId: profile.id,
      role: profile.role,
      requiredPermission: permission,
    });

    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: `Staff role ${profile.role} does not have permission: ${permission}`,
      status: 403,
    });
  }
}

export function enrichStaffContext(profile: StaffProfileDto, request: Request): RequestContext {
  return createRequestContext({
    actor: {
      kind: 'staff',
      staffId: profile.id,
      role: profile.role as StaffRole,
    },
    headers: request.headers,
  });
}


export async function adminGuard(
  request: Request,
  permission: StaffPermission,
): Promise<{ profile: StaffProfileDto; context: RequestContext }> {
  const { profile } = await authenticateStaff(request);
  requireStaffPermission(profile, permission);
  const context = enrichStaffContext(profile, request);
  return { profile, context };
}
