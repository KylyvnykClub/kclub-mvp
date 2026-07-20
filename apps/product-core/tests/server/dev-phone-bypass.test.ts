import { afterEach, describe, expect, test } from 'vitest';

import {
  getDevPhoneBypassOtp,
  getPhoneLookupCandidates,
  isDevPhoneBypassEnabled,
  isValidDevPhoneBypassOtp,
  phonesMatch,
  toDevBypassEmail,
} from '@/server/auth/dev-phone-bypass-config';

const originalEnv = { ...process.env };

function withEnv(overrides: Record<string, string | undefined>): void {
  process.env = { ...originalEnv, ...overrides };
}

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('dev phone bypass helpers', () => {
  test('is disabled in production even when flag is set', () => {
    withEnv({
      NODE_ENV: 'production',
      AUTH_DEV_PHONE_BYPASS_ENABLED: 'true',
      AUTH_DEV_PHONE_BYPASS_SECRET: 'local-dev-bypass-ack',
    });

    expect(isDevPhoneBypassEnabled()).toBe(false);
  });

  test('is disabled when flag is not set', () => {
    withEnv({
      NODE_ENV: 'development',
      AUTH_DEV_PHONE_BYPASS_ENABLED: undefined,
      AUTH_DEV_PHONE_BYPASS_SECRET: 'local-dev-bypass-ack',
    });

    expect(isDevPhoneBypassEnabled()).toBe(false);
  });

  test('is enabled in tests without secret', () => {
    withEnv({
      NODE_ENV: 'test',
      AUTH_DEV_PHONE_BYPASS_ENABLED: 'true',
      AUTH_DEV_PHONE_BYPASS_SECRET: undefined,
    });

    expect(isDevPhoneBypassEnabled()).toBe(true);
  });

  test('requires non-empty secret outside tests', () => {
    withEnv({
      NODE_ENV: 'development',
      AUTH_DEV_PHONE_BYPASS_ENABLED: 'true',
      AUTH_DEV_PHONE_BYPASS_SECRET: undefined,
    });
    expect(isDevPhoneBypassEnabled()).toBe(false);

    withEnv({
      NODE_ENV: 'development',
      AUTH_DEV_PHONE_BYPASS_ENABLED: 'true',
      AUTH_DEV_PHONE_BYPASS_SECRET: 'short',
    });
    expect(isDevPhoneBypassEnabled()).toBe(false);

    withEnv({
      NODE_ENV: 'development',
      AUTH_DEV_PHONE_BYPASS_ENABLED: 'true',
      AUTH_DEV_PHONE_BYPASS_SECRET: 'local-dev-bypass-ack',
    });
    expect(isDevPhoneBypassEnabled()).toBe(true);
  });

  test('uses numeric secret as OTP when valid length', () => {
    withEnv({
      AUTH_DEV_PHONE_BYPASS_SECRET: '424242',
    });

    expect(getDevPhoneBypassOtp()).toBe('424242');
    expect(isValidDevPhoneBypassOtp('424242')).toBe(true);
    expect(isValidDevPhoneBypassOtp('000000')).toBe(false);
  });

  test('falls back to default OTP when secret is not numeric', () => {
    withEnv({
      AUTH_DEV_PHONE_BYPASS_SECRET: 'local-dev-bypass-ack',
    });

    expect(getDevPhoneBypassOtp()).toBe('000000');
    expect(isValidDevPhoneBypassOtp('000000')).toBe(true);
  });

  test('builds stable dev bypass email from phone', () => {
    expect(toDevBypassEmail('+15551234567')).toBe('phone-15551234567@dev.kclub.local');
  });

  test('matches phones regardless of formatting', () => {
    expect(phonesMatch('+15551234567', '+1 (555) 123-4567')).toBe(true);
    expect(phonesMatch('15551234567', '+15551234567')).toBe(true);
    expect(phonesMatch('+15551234568', '+15551234567')).toBe(false);
  });

  test('builds lookup candidates for auth user queries', () => {
    expect(getPhoneLookupCandidates('+15551234567')).toEqual(['+15551234567', '15551234567']);
  });

  test('trims OTP input before validation', () => {
    withEnv({
      AUTH_DEV_PHONE_BYPASS_SECRET: 'local-dev-bypass-ack',
    });

    expect(isValidDevPhoneBypassOtp(' 000000 ')).toBe(true);
  });
});
