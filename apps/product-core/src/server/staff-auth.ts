import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import {
  ERROR_CODES,
  type ApiErrorResponse,
  type ApiResponse,
  type ApiSuccessResponse,
  type StaffAuthSessionDto,
  type StaffProfileDto,
  type StaffRole,
} from '@kclub/contracts';
import {
  parseWithValidation,
  staffPasswordRegisterSchema,
  staffPasswordSignInSchema,
} from '@kclub/validation';
import { and, eq, isNull } from 'drizzle-orm';

import { getDbClient, schema } from '@/server/db';
import { hashStaffPassword, verifyStaffPassword } from '@/server/staff-password';

const SESSION_TTL_SECONDS = 60 * 60 * 8;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

type StaffRecord = typeof schema.adminUsers.$inferSelect;

type StaffSessionPayload = {
  sub: string;
  phone: string;
  name: string | null;
  role: StaffRole;
  exp: number;
};

type EnvBootstrapStaff = {
  id: string;
  phone: string;
  display_name: string | null;
  role: StaffRole;
  is_active: boolean;
  password_hash: string | null;
};

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '').trim();
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_JWT_SECRET must be set to at least 32 characters for staff auth');
  }
  return secret;
}

function sign(input: string): string {
  return createHmac('sha256', getSessionSecret()).update(input).digest('base64url');
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function createSessionToken(payload: StaffSessionPayload): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${header}.${body}.${sign(`${header}.${body}`)}`;
}

function readSessionToken(token: string): StaffSessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expected = sign(`${header}.${body}`);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as StaffSessionPayload;
    if (!payload.exp || payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function createDbSession(
  token: string,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  if (!isUuid(adminUserId)) return;

  try {
    const db = getDbClient();
    await db.insert(schema.adminSessions).values({
      admin_user_id: adminUserId,
      session_token_hash: hashSessionToken(token),
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
      expires_at: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    });
  } catch {
    // DB unavailable - JWT validation still protects the local bootstrap path.
  }
}

async function validateDbSession(token: string): Promise<boolean> {
  try {
    const db = getDbClient();
    const session = await db.query.adminSessions.findFirst({
      where: eq(schema.adminSessions.session_token_hash, hashSessionToken(token)),
    });

    if (!session) return true;
    if (session.revoked_at) return false;
    if (session.expires_at <= new Date()) return false;

    db.update(schema.adminSessions)
      .set({ last_seen_at: new Date() })
      .where(eq(schema.adminSessions.id, session.id))
      .catch(() => {});

    return true;
  } catch {
    return true;
  }
}

async function revokeDbSession(token: string): Promise<void> {
  try {
    const db = getDbClient();
    await db
      .update(schema.adminSessions)
      .set({ revoked_at: new Date() })
      .where(
        and(
          eq(schema.adminSessions.session_token_hash, hashSessionToken(token)),
          isNull(schema.adminSessions.revoked_at),
        ),
      );
  } catch {
    // DB unavailable
  }
}

function getEnvBootstrapStaff(phone: string): EnvBootstrapStaff | null {
  const ownerPhone = process.env.ADMIN_BOOTSTRAP_OWNER_PHONE;
  const ownerPassword = process.env.ADMIN_BOOTSTRAP_OWNER_PASSWORD;
  if (!ownerPhone || !ownerPassword) return null;

  const normalizedPhone = normalizePhone(phone);
  if (normalizePhone(ownerPhone) !== normalizedPhone) return null;

  return {
    id: `bootstrap-owner-${normalizedPhone}`,
    phone: normalizedPhone,
    display_name: 'Bootstrap Owner',
    role: 'OWNER',
    is_active: true,
    password_hash: null,
  };
}

async function findDbStaffByPhone(phone: string): Promise<StaffRecord | null> {
  try {
    const db = getDbClient();
    return (
      (await db.query.adminUsers.findFirst({
        where: eq(schema.adminUsers.phone, normalizePhone(phone)),
      })) ?? null
    );
  } catch {
    return null;
  }
}

async function findDbStaffById(staffId: string): Promise<StaffRecord | null> {
  if (!isUuid(staffId)) return null;

  try {
    const db = getDbClient();
    return (
      (await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, staffId) })) ?? null
    );
  } catch {
    return null;
  }
}

async function findStaffByPhone(phone: string): Promise<StaffRecord | EnvBootstrapStaff | null> {
  const envStaff = getEnvBootstrapStaff(phone);
  if (envStaff) return envStaff;

  return findDbStaffByPhone(phone);
}

async function findStaffBySessionPayload(
  payload: StaffSessionPayload,
): Promise<StaffRecord | EnvBootstrapStaff | null> {
  const envStaff = getEnvBootstrapStaff(payload.phone);
  if (envStaff?.id === payload.sub) return envStaff;

  const dbStaff = await findDbStaffById(payload.sub);
  if (dbStaff) return dbStaff;

  return null;
}

function staffToProfile(staff: StaffRecord | EnvBootstrapStaff): StaffProfileDto {
  const role = getSupportedStaffRole(staff.role);
  if (!role) {
    throw new Error('Unsupported staff role');
  }

  return {
    id: staff.id,
    phone: staff.phone,
    displayName: staff.display_name,
    role,
  };
}

function getSupportedStaffRole(role: string): StaffRole | null {
  if (role === 'OWNER' || role === 'ADMIN' || role === 'MODERATOR') {
    return role;
  }

  return null;
}

function success<T>(data: T): ApiSuccessResponse<T> {
  return { data, error: null };
}

function error(code: ApiErrorResponse['error']['code'], message: string, status = 400): Response {
  return Response.json({ data: null, error: { code, message } } satisfies ApiErrorResponse, {
    status,
  });
}

function getClientIp(request: Request): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null
  );
}

function createAuthenticatedSession(
  staff: StaffRecord | EnvBootstrapStaff,
  request: Request,
): Promise<StaffAuthSessionDto> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const role = getSupportedStaffRole(staff.role);
  if (!role) {
    throw new Error('Unsupported staff role');
  }

  const token = createSessionToken({
    sub: staff.id,
    phone: staff.phone,
    name: staff.display_name,
    role,
    exp: expiresAt,
  });

  return createDbSession(
    token,
    staff.id,
    getClientIp(request),
    request.headers.get('user-agent'),
  ).then(() => ({
    state: 'AUTHENTICATED',
    profile: staffToProfile(staff),
    token,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  }));
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
}

export async function getStaffSession(token: string): Promise<StaffProfileDto | null> {
  const payload = readSessionToken(token);
  if (!payload) return null;

  const staff = await findStaffBySessionPayload(payload);
  const role = staff ? getSupportedStaffRole(staff.role) : null;
  if (!staff?.is_active || staff.id !== payload.sub || role !== payload.role) {
    return null;
  }

  if (!isUuid(staff.id)) {
    return staffToProfile(staff);
  }

  const dbValid = await validateDbSession(token);
  if (!dbValid) return null;

  return staffToProfile(staff);
}

export async function handleStaffPasswordRegister(request: Request): Promise<Response> {
  const rawBody = await request.json().catch(() => null);
  const parsed = parseWithValidation(staffPasswordRegisterSchema, rawBody);
  if (!parsed.success) {
    return error(ERROR_CODES.VALIDATION_INVALID_INPUT, 'Phone and password are required');
  }

  const staff = await findDbStaffByPhone(parsed.data.phone);
  if (!staff) {
    return error(
      ERROR_CODES.AUTH_STAFF_NOT_ALLOWED,
      'This phone is not allowed for staff access',
      403,
    );
  }
  if (!staff.is_active) {
    return error(ERROR_CODES.AUTH_STAFF_INACTIVE, 'This staff account is inactive', 403);
  }
  if (!getSupportedStaffRole(staff.role)) {
    return error(
      ERROR_CODES.AUTH_STAFF_NOT_ALLOWED,
      'This staff role is not allowed to sign in',
      403,
    );
  }
  if (staff.password_hash) {
    return error(
      ERROR_CODES.RESOURCE_CONFLICT,
      'Password is already set for this staff account',
      409,
    );
  }

  const db = getDbClient();
  await db
    .update(schema.adminUsers)
    .set({
      password_hash: await hashStaffPassword(parsed.data.password),
      password_set_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(schema.adminUsers.id, staff.id));

  return Response.json(success({ registered: true }));
}

export async function handleStaffPasswordSignIn(request: Request): Promise<Response> {
  const rawBody = await request.json().catch(() => null);
  const parsed = parseWithValidation(staffPasswordSignInSchema, rawBody);
  if (!parsed.success) {
    return error(ERROR_CODES.VALIDATION_INVALID_INPUT, 'Phone and password are required');
  }

  const staff = await findStaffByPhone(parsed.data.phone);
  if (!staff) {
    return error(
      ERROR_CODES.AUTH_STAFF_NOT_ALLOWED,
      'This phone is not allowed for staff access',
      403,
    );
  }
  if (!staff.is_active) {
    return error(ERROR_CODES.AUTH_STAFF_INACTIVE, 'This staff account is inactive', 403);
  }

  let isValidPassword = false;
  if (staff.password_hash) {
    isValidPassword = await verifyStaffPassword(parsed.data.password, staff.password_hash);
  } else if (staff.id.startsWith('bootstrap-owner-')) {
    isValidPassword = parsed.data.password === process.env.ADMIN_BOOTSTRAP_OWNER_PASSWORD;
  } else {
    return error(
      ERROR_CODES.AUTH_PASSWORD_NOT_SET,
      'Password is not set for this staff account',
      403,
    );
  }

  if (!isValidPassword) {
    return error(ERROR_CODES.AUTH_PASSWORD_INVALID, 'Invalid staff phone or password', 401);
  }

  return Response.json(
    success<StaffAuthSessionDto>(await createAuthenticatedSession(staff, request)),
  );
}

export async function handleStaffSession(request: Request): Promise<Response> {
  const token = getBearerToken(request);
  if (!token) {
    return error(ERROR_CODES.AUTH_SESSION_REQUIRED, 'Staff session is required', 401);
  }

  const profile = await getStaffSession(token);
  if (!profile) {
    return error(ERROR_CODES.AUTH_SESSION_INVALID, 'Staff session is invalid or expired', 401);
  }

  return Response.json(
    success<ApiResponse<StaffProfileDto>['data']>({
      ...profile,
    }),
  );
}

export async function handleStaffLogout(request: Request): Promise<Response> {
  const token = getBearerToken(request);
  if (!token) {
    return error(ERROR_CODES.AUTH_SESSION_REQUIRED, 'Staff session is required', 401);
  }

  const payload = readSessionToken(token);
  if (!payload) {
    return error(ERROR_CODES.AUTH_SESSION_INVALID, 'Staff session is invalid or expired', 401);
  }

  await revokeDbSession(token);

  return Response.json(success({ loggedOut: true }));
}
