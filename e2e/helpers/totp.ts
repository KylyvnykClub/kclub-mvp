import { createHmac } from 'node:crypto';

function decodeBase32(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = input.toUpperCase().replace(/=+$/g, '');

  let bits = '';
  for (const character of normalized) {
    const index = alphabet.indexOf(character);
    if (index === -1) {
      throw new Error('Invalid base32 secret in TOTP URI');
    }

    bits += index.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

export function generateTotpFromUri(uri: string, now = Date.now()): string {
  const parsed = new URL(uri);
  const secret = parsed.searchParams.get('secret');
  const digits = Number.parseInt(parsed.searchParams.get('digits') ?? '6', 10);
  const period = Number.parseInt(parsed.searchParams.get('period') ?? '30', 10);
  const algorithm = (parsed.searchParams.get('algorithm') ?? 'SHA1').toLowerCase();

  if (!secret) {
    throw new Error('TOTP URI is missing the secret parameter');
  }

  const secretBytes = decodeBase32(secret);
  const counter = Math.floor(now / 1000 / period);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac(algorithm, secretBytes).update(counterBuffer).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const code =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);

  return String(code % 10 ** digits).padStart(digits, '0');
}
