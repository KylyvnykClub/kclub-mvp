import { describe, expect, test } from 'vitest';

import {
  parseCardNumber,
  formatCardNumber,
  cardNumberSchema,
  cardNumberToTierPrefix,
} from '../../src/server/services/card-helpers';

describe('parseCardNumber', () => {
  test('parses MEM card number', () => {
    const result = parseCardNumber('MEM-000001');
    expect(result).toEqual({ tier: 'MEM', sequence: 1 });
  });

  test('parses VIP card number', () => {
    const result = parseCardNumber('VIP-123456');
    expect(result).toEqual({ tier: 'VIP', sequence: 123456 });
  });

  test('parses max sequence', () => {
    const result = parseCardNumber('MEM-999999');
    expect(result).toEqual({ tier: 'MEM', sequence: 999999 });
  });

  test('handles uppercase', () => {
    const result = parseCardNumber('MEM-000042');
    expect(result.sequence).toBe(42);
  });

  test('throws on invalid format', () => {
    expect(() => parseCardNumber('INVALID')).toThrow('Invalid card number format');
  });

  test('throws on missing padding', () => {
    expect(() => parseCardNumber('MEM-1')).toThrow('Invalid card number format');
  });

  test('throws on empty string', () => {
    expect(() => parseCardNumber('')).toThrow('Invalid card number format');
  });
});

describe('formatCardNumber', () => {
  test('formats MEM tier', () => {
    expect(formatCardNumber('MEM', 1)).toBe('MEM-000001');
  });

  test('formats VIP tier', () => {
    expect(formatCardNumber('VIP', 42)).toBe('VIP-000042');
  });

  test('pads to 6 digits', () => {
    expect(formatCardNumber('MEM', 999999)).toBe('MEM-999999');
  });
});

describe('cardNumberSchema', () => {
  test('accepts valid MEM card', () => {
    expect(cardNumberSchema.parse('mem-000001')).toBe('MEM-000001');
  });

  test('accepts valid VIP card', () => {
    expect(cardNumberSchema.parse('VIP-123456')).toBe('VIP-123456');
  });

  test('rejects invalid format', () => {
    const result = cardNumberSchema.safeParse('ABC-000001');
    expect(result.success).toBe(false);
  });

  test('rejects short sequence', () => {
    const result = cardNumberSchema.safeParse('MEM-001');
    expect(result.success).toBe(false);
  });
});

describe('cardNumberToTierPrefix', () => {
  test('maps MEMBER to MEM', () => {
    expect(cardNumberToTierPrefix('MEMBER')).toBe('MEM');
  });

  test('maps VIP to VIP', () => {
    expect(cardNumberToTierPrefix('VIP')).toBe('VIP');
  });
});
