import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const HASH_PREFIX = 'scrypt';

export async function hashStaffPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const hash = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return [
    HASH_PREFIX,
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString('base64url'),
    hash.toString('base64url'),
  ].join('$');
}

export async function verifyStaffPassword(password: string, storedHash: string): Promise<boolean> {
  const [prefix, nValue, rValue, pValue, saltValue, hashValue] = storedHash.split('$');
  if (prefix !== HASH_PREFIX || !nValue || !rValue || !pValue || !saltValue || !hashValue) {
    return false;
  }

  const expectedHash = Buffer.from(hashValue, 'base64url');
  const actualHash = scryptSync(password, Buffer.from(saltValue, 'base64url'), KEY_LENGTH, {
    N: Number(nValue),
    r: Number(rValue),
    p: Number(pValue),
  });

  return expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash);
}
