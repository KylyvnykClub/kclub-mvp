import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { RequestContext } from '../src/server/context';
import { hashStaffPassword } from '../src/server/staff-password';

const realDb = await import('../src/server/db');

const STAFF_ID = '11111111-1111-7111-8111-111111111111';
const STAFF_PHONE = '+15557654321';
const PASSWORD = 'StrongPassword123';

const baseStaff = {
  id: STAFF_ID,
  phone: STAFF_PHONE,
  display_name: 'Approved Admin',
  role: 'ADMIN',
  is_active: true,
  password_hash: null as string | null,
  password_set_at: null as Date | null,
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  updated_at: new Date('2026-01-01T00:00:00.000Z'),
  totp_secret_encrypted: null,
  totp_verified_at: null,
};

let staff = { ...baseStaff };
let revokedSessions = 0;
let activeOwnerCount = 0;

function updateChain(table: unknown) {
  return {
    set: (values: Record<string, unknown>) => ({
      where: vi.fn(() => {
        if (table === realDb.schema.adminUsers) {
          staff = { ...staff, ...values };
        }
        if (table === realDb.schema.adminSessions && values.revoked_at) {
          revokedSessions += 1;
        }

        return {
          returning: vi.fn(async () => [staff]),
        };
      }),
    }),
  };
}

const db = {
  query: {
    adminUsers: {
      findFirst: vi.fn(async () => staff),
    },
    adminSessions: {
      findFirst: vi.fn(async () => ({
        token_hash: 'session',
        revoked_at: null,
        expires_at: new Date(Date.now() + 60_000),
      })),
    },
  },
  $count: vi.fn(async () => activeOwnerCount),
  update: vi.fn(updateChain),
  insert: vi.fn(() => ({
    values: vi.fn(async () => undefined),
  })),
  transaction: vi.fn(async (callback: (tx: { update: typeof updateChain }) => Promise<unknown>) =>
    callback({ update: updateChain }),
  ),
};

vi.mock('@/server/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/server/db')>();
  // `db` is referenced lazily so the hoisted factory never touches TDZ state
  return { ...actual, getDbClient: () => db };
});

vi.mock('@/server/audit', () => ({
  createDbAuditService: () => ({
    log: vi.fn(async () => ({ id: 'audit-1' })),
  }),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(() => undefined),
}));

const { handleStaffPasswordRegister, handleStaffPasswordSignIn, handleStaffSession } =
  await import('../src/server/staff-auth');
const { deactivateStaff, resetStaffPassword, updateStaffRole } =
  await import('../src/server/services/admin-service');

function passwordRequest(body: Record<string, string>): Request {
  return new Request('http://localhost/api/admin/v1/staff-auth/password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

describe('staff password auth with approved DB staff', () => {
  beforeEach(() => {
    process.env.ADMIN_JWT_SECRET = 'staff-db-test-secret-at-least-32-chars';
    delete process.env.ADMIN_BOOTSTRAP_OWNER_PHONE;
    delete process.env.ADMIN_BOOTSTRAP_OWNER_PASSWORD;
    staff = { ...baseStaff };
    revokedSessions = 0;
    activeOwnerCount = 0;
    db.query.adminUsers.findFirst.mockClear();
    db.$count.mockClear();
  });

  test('approved active staff can register once and then sign in with password', async () => {
    const registerResponse = await handleStaffPasswordRegister(
      passwordRequest({ phone: STAFF_PHONE, password: PASSWORD }),
    );
    const registerPayload = await readJson<{ data: { registered: boolean } }>(registerResponse);

    expect(registerResponse.status).toBe(200);
    expect(registerPayload.data.registered).toBe(true);
    expect(staff.password_hash).toMatch(/^scrypt\$16384\$8\$1\$/);
    expect(staff.password_set_at).toBeInstanceOf(Date);

    const duplicateResponse = await handleStaffPasswordRegister(
      passwordRequest({ phone: STAFF_PHONE, password: PASSWORD }),
    );
    const duplicatePayload = await readJson<{ error: { code: string } }>(duplicateResponse);

    expect(duplicateResponse.status).toBe(409);
    expect(duplicatePayload.error.code).toBe('RESOURCE_CONFLICT');

    const signInResponse = await handleStaffPasswordSignIn(
      passwordRequest({ phone: STAFF_PHONE, password: PASSWORD }),
    );
    const signInPayload = await readJson<{
      data: { state: string; token: string; profile: { id: string } };
    }>(signInResponse);

    expect(signInResponse.status).toBe(200);
    expect(signInPayload.data.state).toBe('AUTHENTICATED');
    expect(signInPayload.data.profile.id).toBe(STAFF_ID);

    expect(signInPayload.data.token.split('.')).toHaveLength(3);

    const wrongPasswordResponse = await handleStaffPasswordSignIn(
      passwordRequest({ phone: STAFF_PHONE, password: 'WrongPassword123' }),
    );
    const wrongPasswordPayload = await readJson<{ error: { code: string } }>(wrongPasswordResponse);

    expect(wrongPasswordResponse.status).toBe(401);
    expect(wrongPasswordPayload.error.code).toBe('AUTH_PASSWORD_INVALID');
  });

  test('accepts a UUIDv7 staff token immediately after sign-in', async () => {
    staff = {
      ...staff,
      password_hash: await hashStaffPassword(PASSWORD),
      password_set_at: new Date(),
    };

    const signInResponse = await handleStaffPasswordSignIn(
      passwordRequest({ phone: STAFF_PHONE, password: PASSWORD }),
    );
    const signInPayload = await readJson<{ data: { token: string } }>(signInResponse);

    const sessionResponse = await handleStaffSession(
      new Request('http://localhost/api/admin/v1/staff-auth/session', {
        headers: { authorization: `Bearer ${signInPayload.data.token}` },
      }),
    );
    const sessionPayload = await readJson<{ data: { id: string } }>(sessionResponse);

    expect(sessionResponse.status).toBe(200);
    expect(sessionPayload.data.id).toBe(STAFF_ID);
  });

  test('inactive staff cannot register or sign in, and reset revokes sessions', async () => {
    staff = { ...staff, is_active: false };

    const registerResponse = await handleStaffPasswordRegister(
      passwordRequest({ phone: STAFF_PHONE, password: PASSWORD }),
    );
    const registerPayload = await readJson<{ error: { code: string } }>(registerResponse);

    expect(registerResponse.status).toBe(403);
    expect(registerPayload.error.code).toBe('AUTH_STAFF_INACTIVE');

    const signInResponse = await handleStaffPasswordSignIn(
      passwordRequest({ phone: STAFF_PHONE, password: PASSWORD }),
    );
    const signInPayload = await readJson<{ error: { code: string } }>(signInResponse);

    expect(signInResponse.status).toBe(403);
    expect(signInPayload.error.code).toBe('AUTH_STAFF_INACTIVE');

    staff = {
      ...staff,
      is_active: true,
      password_hash: 'scrypt$16384$8$1$c2FsdA$YWFh',
      password_set_at: new Date('2026-01-02T00:00:00.000Z'),
    };

    const context: RequestContext = {
      actor: { kind: 'staff', staffId: 'owner', role: 'OWNER' },
      ipAddress: null,
      userAgent: null,
      locale: null,
      requestId: 'reset-password-test',
    };

    const result = await resetStaffPassword(STAFF_ID, { reason: 'owner reset' }, context);

    expect(result.passwordStatus).toBe('NOT_SET');
    expect(staff.password_hash).toBeNull();
    expect(staff.password_set_at).toBeNull();
    expect(revokedSessions).toBe(1);
  });

  test('last active owner cannot be downgraded or deactivated', async () => {
    staff = { ...staff, role: 'OWNER' };
    const context: RequestContext = {
      actor: { kind: 'staff', staffId: STAFF_ID, role: 'OWNER' },
      ipAddress: null,
      userAgent: null,
      locale: null,
      requestId: 'last-owner-test',
    };

    await expect(updateStaffRole(STAFF_ID, { role: 'ADMIN' }, context)).rejects.toThrow(
      'Cannot remove the last active owner',
    );
    expect(staff.role).toBe('OWNER');

    await expect(
      deactivateStaff(STAFF_ID, { reason: 'owner clicked wrong button' }, context),
    ).rejects.toThrow('Cannot remove the last active owner');
    expect(staff.is_active).toBe(true);
  });

  test('owner role removal is allowed when another active owner remains', async () => {
    staff = { ...staff, role: 'OWNER' };
    activeOwnerCount = 1;
    const context: RequestContext = {
      actor: { kind: 'staff', staffId: '22222222-2222-4222-8222-222222222222', role: 'OWNER' },
      ipAddress: null,
      userAgent: null,
      locale: null,
      requestId: 'another-owner-test',
    };

    const updated = await updateStaffRole(STAFF_ID, { role: 'ADMIN' }, context);

    expect(updated.role).toBe('ADMIN');
    expect(staff.role).toBe('ADMIN');
  });
});
