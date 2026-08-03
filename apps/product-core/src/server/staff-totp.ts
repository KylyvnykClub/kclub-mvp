import { createHash, randomBytes } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { TOTP } from 'otpauth';

import { getDbClient, schema } from '@/server/db';
import { decryptSecret, encryptSecret } from '@/server/totp-crypto';

const ISSUER = 'KYLYVNYK CLUB Admin';
const BACKUP_CODE_COUNT = 8;

export async function hasVerifiedTotp(adminUserId: string): Promise<boolean> {
  const db = getDbClient();
  const record = await db.query.admin2fa.findFirst({
    where: eq(schema.admin2fa.admin_user_id, adminUserId),
  });
  return !!record?.verified_at;
}

export async function setupTotp(
  adminUserId: string,
  phone: string,
): Promise<{ uri: string; backupCodes: string[] }> {
  const db = getDbClient();

  const existing = await db.query.admin2fa.findFirst({
    where: eq(schema.admin2fa.admin_user_id, adminUserId),
  });
  if (existing?.verified_at) {
    throw new Error('TOTP already verified');
  }

  const totp = new TOTP({ issuer: ISSUER, label: phone, digits: 6, period: 30 });
  const secret = totp.secret.base32;
  const uri = totp.toString();

  const backupCodes = Array.from({ length: BACKUP_CODE_COUNT }, () =>
    randomBytes(4).toString('hex'),
  );
  const backupHashes = backupCodes.map((code) => createHash('sha256').update(code).digest('hex'));

  const ciphertext = encryptSecret(secret);

  if (existing) {
    await db
      .update(schema.admin2fa)
      .set({
        secret_ciphertext: ciphertext,
        backup_codes_hashes: backupHashes,
        verified_at: null,
        updated_at: new Date(),
      })
      .where(eq(schema.admin2fa.admin_user_id, adminUserId));
  } else {
    await db.insert(schema.admin2fa).values({
      admin_user_id: adminUserId,
      secret_ciphertext: ciphertext,
      backup_codes_hashes: backupHashes,
    });
  }

  return { uri, backupCodes };
}

export async function verifyAndActivateTotp(adminUserId: string, code: string): Promise<boolean> {
  const db = getDbClient();
  const record = await db.query.admin2fa.findFirst({
    where: eq(schema.admin2fa.admin_user_id, adminUserId),
  });
  if (!record) return false;

  const secret = decryptSecret(record.secret_ciphertext);
  const totp = new TOTP({ secret, digits: 6, period: 30 });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) return false;

  await db
    .update(schema.admin2fa)
    .set({ verified_at: new Date(), updated_at: new Date() })
    .where(eq(schema.admin2fa.admin_user_id, adminUserId));

  await db
    .update(schema.adminUsers)
    .set({ totp_verified_at: new Date(), updated_at: new Date() })
    .where(eq(schema.adminUsers.id, adminUserId));

  return true;
}

export async function verifyTotpCode(adminUserId: string, code: string): Promise<boolean> {
  const db = getDbClient();
  const record = await db.query.admin2fa.findFirst({
    where: eq(schema.admin2fa.admin_user_id, adminUserId),
  });
  if (!record?.verified_at) return false;

  if (/^\d{6}$/.test(code)) {
    const secret = decryptSecret(record.secret_ciphertext);
    const totp = new TOTP({ secret, digits: 6, period: 30 });
    return totp.validate({ token: code, window: 1 }) !== null;
  }

  if (/^[0-9a-f]{8}$/.test(code) && Array.isArray(record.backup_codes_hashes)) {
    const hashed = createHash('sha256').update(code).digest('hex');
    const hashes = record.backup_codes_hashes as string[];
    const index = hashes.indexOf(hashed);
    if (index === -1) return false;

    const updated = [...hashes];
    updated.splice(index, 1);
    await db
      .update(schema.admin2fa)
      .set({ backup_codes_hashes: updated, updated_at: new Date() })
      .where(eq(schema.admin2fa.admin_user_id, adminUserId));

    return true;
  }

  return false;
}
