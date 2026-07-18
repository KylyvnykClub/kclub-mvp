import { describe, expect, test } from 'vitest';

import { AUTH_INTENT, determineAuthIntent, assertIntentAllowed } from '../../src/server/services';

describe('determineAuthIntent', () => {
  test('sign-in with existing active user returns SIGN_IN_EXISTS', () => {
    const intent = determineAuthIntent({ status: 'ACTIVE' }, 'sign-in');
    expect(intent).toBe(AUTH_INTENT.SIGN_IN_EXISTS);
  });

  test('sign-in with blocked user returns SIGN_IN_BLOCKED', () => {
    const intent = determineAuthIntent({ status: 'BLOCKED' }, 'sign-in');
    expect(intent).toBe(AUTH_INTENT.SIGN_IN_BLOCKED);
  });

  test('sign-in with unknown phone returns SIGN_IN_UNKNOWN', () => {
    const intent = determineAuthIntent(null, 'sign-in');
    expect(intent).toBe(AUTH_INTENT.SIGN_IN_UNKNOWN);
  });

  test('sign-up with no existing user returns SIGN_UP_NEW', () => {
    const intent = determineAuthIntent(null, 'sign-up');
    expect(intent).toBe(AUTH_INTENT.SIGN_UP_NEW);
  });

  test('sign-up with existing user returns SIGN_UP_EXISTS', () => {
    const intent = determineAuthIntent({ status: 'ACTIVE' }, 'sign-up');
    expect(intent).toBe(AUTH_INTENT.SIGN_UP_EXISTS);
  });

  test('sign-up with blocked user returns SIGN_UP_EXISTS (blocked is still exists)', () => {
    const intent = determineAuthIntent({ status: 'BLOCKED' }, 'sign-up');
    expect(intent).toBe(AUTH_INTENT.SIGN_UP_EXISTS);
  });
});

describe('assertIntentAllowed', () => {
  test('allows SIGN_IN_EXISTS without error', () => {
    expect(() => assertIntentAllowed(AUTH_INTENT.SIGN_IN_EXISTS, 'sign-in')).not.toThrow();
  });

  test('allows SIGN_UP_NEW without error', () => {
    expect(() => assertIntentAllowed(AUTH_INTENT.SIGN_UP_NEW, 'sign-up')).not.toThrow();
  });

  test('throws PERMISSION_DENIED for blocked user', () => {
    expect(() => assertIntentAllowed(AUTH_INTENT.SIGN_IN_BLOCKED, 'sign-in')).toThrow(
      'Account is blocked',
    );
  });

  test('throws AUTH_SIGN_UP_USE_SIGN_IN for sign-up with existing phone', () => {
    expect(() => assertIntentAllowed(AUTH_INTENT.SIGN_UP_EXISTS, 'sign-up')).toThrow(
      'An account with this phone already exists',
    );
  });

  test('throws AUTH_SIGN_IN_USE_SIGN_UP for sign-in with unknown phone', () => {
    expect(() => assertIntentAllowed(AUTH_INTENT.SIGN_IN_UNKNOWN, 'sign-in')).toThrow(
      'No account found with this phone',
    );
  });
});
