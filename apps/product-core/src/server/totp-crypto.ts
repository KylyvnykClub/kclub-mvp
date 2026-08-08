import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const key = process.env.TOTP_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('TOTP_ENCRYPTION_KEY environment variable is required');
  }
  return Buffer.from(key, 'base64');
}

export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decryptSecret(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }

  const [ivHex, tagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex!, 'hex');
  const tag = Buffer.from(tagHex!, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted: string = decipher.update(encrypted!, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
