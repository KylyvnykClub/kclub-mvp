import { scryptSync, timingSafeEqual } from 'node:crypto';

import { hash, verify } from '@node-rs/argon2';

const ARGON2_PREFIX = 'argon2';
const SCRYPT_PREFIX = 'scrypt';

export async function hashStaffPassword(password: string): Promise<string> {
  const hashed = await hash(password, {
    memoryCost: 65536,
    timeCost: 3,
    outputLen: 64,
    parallelism: 4,
  });
  return `${ARGON2_PREFIX}$${hashed}`;
}

export async function verifyStaffPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith(`${ARGON2_PREFIX}$`)) {
    const raw = storedHash.slice(ARGON2_PREFIX.length + 1);
    return verify(raw, password);
  }

  if (storedHash.startsWith(`${SCRYPT_PREFIX}$`)) {
    return verifyScryptLegacy(password, storedHash);
  }

  return false;
}

export function needsRehash(storedHash: string): boolean {
  return !storedHash.startsWith(`${ARGON2_PREFIX}$`);
}

function verifyScryptLegacy(password: string, storedHash: string): boolean {
  const [prefix, nValue, rValue, pValue, saltValue, hashValue] = storedHash.split('$');
  if (prefix !== SCRYPT_PREFIX || !nValue || !rValue || !pValue || !saltValue || !hashValue) {
    return false;
  }

  const expectedHash = Buffer.from(hashValue, 'base64url');
  const actualHash = scryptSync(password, Buffer.from(saltValue, 'base64url'), 64, {
    N: Number(nValue),
    r: Number(rValue),
    p: Number(pValue),
  });

  return expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash);
}
