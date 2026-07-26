import { describe, expect, test } from 'vitest';

import { redactSensitiveFields, safeErrorForLog } from '@/server/logger/redact';

describe('redactSensitiveFields', () => {
  test('redacts known sensitive fields', () => {
    const input = {
      phone: '+1234567890',
      email: 'test@example.com',
      ipAddress: '192.168.1.1',
      name: 'John Doe',
      count: 42,
    };

    const result = redactSensitiveFields(input);

    expect(result.phone).toBe('[REDACTED]');
    expect(result.email).toBe('[REDACTED]');
    expect(result.ipAddress).toBe('[REDACTED]');
    expect(result.name).toBe('John Doe');
    expect(result.count).toBe(42);
  });

  test('redacts nested sensitive fields', () => {
    const input = {
      user: {
        phone: '+1234567890',
        profile: { displayName: 'John' },
      },
      meta: { requestId: 'abc-123' },
    };

    const result = redactSensitiveFields(input);

    expect((result.user as Record<string, unknown>).phone).toBe('[REDACTED]');
    expect((result.user as Record<string, unknown>).profile).toEqual({ displayName: 'John' });
    expect((result.meta as Record<string, unknown>).requestId).toBe('abc-123');
  });

  test('handles null and undefined', () => {
    expect(redactSensitiveFields({ a: null, b: undefined })).toEqual({ a: null, b: undefined });
  });

  test('truncates long strings', () => {
    const longString = 'a'.repeat(3000);
    const result = redactSensitiveFields({ data: longString });
    expect(result.data).toMatch(/^a+\.\.\.\[truncated, 3000 chars\]$/);
  });

  test('handles arrays', () => {
    const input = {
      items: [
        { phone: '+111', name: 'A' },
        { phone: '+222', name: 'B' },
      ],
    };

    const result = redactSensitiveFields(input);
    const items = result.items as Array<Record<string, unknown>>;
    expect(items[0]!.phone).toBe('[REDACTED]');
    expect(items[0]!.name).toBe('A');
    expect(items[1]!.phone).toBe('[REDACTED]');
    expect(items[1]!.name).toBe('B');
  });

  test('handles empty object', () => {
    expect(redactSensitiveFields({})).toEqual({});
  });

  test('limits recursion depth', () => {
    const deep: Record<string, unknown> = {};
    let current = deep;
    for (let i = 0; i < 15; i++) {
      current.nested = {};
      current = current.nested as Record<string, unknown>;
    }
    current.value = 'deep';

    const result = redactSensitiveFields(deep);
    expect(result.nested).toBeDefined();
  });
});

describe('safeErrorForLog', () => {
  test('extracts code and message from AppError-like object', () => {
    const result = safeErrorForLog({ code: 'AUTH_OTP_INVALID', message: 'Invalid OTP code' });
    expect(result).toEqual({ code: 'AUTH_OTP_INVALID', message: 'Invalid OTP code' });
  });

  test('includes redacted details from AppError', () => {
    const error = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: { phone: '+1234567890', field: 'phone' },
    };
    const result = safeErrorForLog(error);
    expect(result).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: { phone: '[REDACTED]', field: 'phone' },
    });
  });

  test('handles standard Error', () => {
    const result = safeErrorForLog(new Error('Something went wrong'));
    expect(result).toEqual({ code: 'UNKNOWN_ERROR', message: 'Something went wrong' });
  });

  test('returns null for null or undefined', () => {
    expect(safeErrorForLog(null)).toBeNull();
    expect(safeErrorForLog(undefined)).toBeNull();
  });

  test('handles string error', () => {
    const result = safeErrorForLog('string error');
    expect(result).toEqual({ code: 'UNKNOWN_ERROR', message: 'string error' });
  });
});
