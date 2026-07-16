import { beforeEach, describe, expect, mock, test } from 'bun:test';

import type { RequestContext } from '../src/server/context';

const realDb = await import('../src/server/db');

const STAFF_ID = '11111111-1111-4111-8111-111111111111';
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

function updateChain(table: unknown) {
  return {
    set: (values: Record<string, unknown>) => ({
      where: mock(() => {
        if (table === realDb.schema.adminUsers) {
          staff = { ...staff, ...values };
        }
        if (table === realDb.schema.adminSessions && values.revoked_at) {
          revokedSessions += 1;
        }

        return {
          returning: mock(async () => [staff]),
        };
      }),
    }),
  };
}

const db = {
  query: {
    adminUsers: {
      findFirst: mock(async () => staff),
    },
    adminSessions: {
      findFirst: mock(async () => ({
        token_hash: 'session',
        revoked_at: null,
        expires_at: new Date(Date.now() + 60_000),
      })),
    },
  },
  update: mock(updateChain),
  insert: mock(() => ({
    values: mock(async () => undefined),
  })),
  transaction: mock(async (callback: (tx: { update: typeof updateChain }) => Promise<unknown>) =>
    callback({ update: updateChain }),
  ),
};

mock.module('@/server/db', () => ({
  ...realDb,
  getDbClient: () => db,
}));

mock.module('@/server/audit', () => ({
  createDbAuditService: () => ({
    log: mock(async () => ({ id: 'audit-1' })),
  }),
}));

mock.module('next/cache', () => ({
  revalidateTag: mock(() => undefined),
}));

const { handleStaffPasswordRegister, handleStaffPasswordSignIn } =
  await import('../src/server/staff-auth');
const { resetStaffPassword } = await import('../src/server/services/admin-service');

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
    db.query.adminUsers.findFirst.mockClear();
  });

  test('approved active staff can register once and then sign in with password', async () => {
    const registerResponse = await handleStaffPasswordRegister(
      passwordRequest({ phone: STAFF_PHONE, password: PASSWORD }),
    );
    const registerPayload = await readJson<{ data: { registered: boolean } }>(registerResponse);

    expect(registerResponse.status).toBe(200);
    expect(registerPayload.data.registered).toBe(true);
    expect(staff.password_hash).toStartWith('scrypt$16384$8$1$');
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
});
