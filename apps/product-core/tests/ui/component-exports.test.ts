import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

describe('layout component exports', () => {
  test('loading component module exports a function', async () => {
    const mod = await import('@/app/[locale]/loading');
    expect(typeof mod.default).toBe('function');
  });

  test('error component module exports a function', async () => {
    const mod = await import('@/app/[locale]/error');
    expect(typeof mod.default).toBe('function');
  });

  test('not-found component module exports a function', async () => {
    const mod = await import('@/app/[locale]/not-found');
    expect(typeof mod.default).toBe('function');
  });
});

describe('route group layout exports', () => {
  test('marketing layout exports a function', async () => {
    const mod = await import('@/app/[locale]/(marketing)/layout');
    expect(typeof mod.default).toBe('function');
  });

  test('auth layout exports a function', async () => {
    const mod = await import('@/app/[locale]/(auth)/layout');
    expect(typeof mod.default).toBe('function');
  });

  test('member layout exports a function', async () => {
    const mod = await import('@/app/[locale]/(member)/layout');
    expect(typeof mod.default).toBe('function');
  });
});

describe('member route exports', () => {
  test('onboarding page exports a function', async () => {
    const mod = await import('@/app/[locale]/(member)/m/onboarding/page');
    expect(typeof mod.default).toBe('function');
  });

  test('dashboard page exports a function', async () => {
    const mod = await import('@/app/[locale]/(member)/m/dashboard/page');
    expect(typeof mod.default).toBe('function');
  });

  test('member alias pages export functions', async () => {
    const card = await import('@/app/[locale]/(member)/m/card/page');
    const profile = await import('@/app/[locale]/(member)/m/profile/page');
    const subscription = await import('@/app/[locale]/(member)/m/subscription/page');
    const myBusiness = await import('@/app/[locale]/(member)/m/my-business/page');
    const introduce = await import('@/app/[locale]/(member)/m/introduce/page');

    expect(typeof card.default).toBe('function');
    expect(typeof profile.default).toBe('function');
    expect(typeof subscription.default).toBe('function');
    expect(typeof myBusiness.default).toBe('function');
    expect(typeof introduce.default).toBe('function');
  });
});

describe('shared ui imports', () => {
  test('imports SkipLink from @kclub/ui', async () => {
    const mod = await import('@kclub/ui');
    expect(typeof mod.SkipLink).toBe('function');
  });

  test('imports Container from @kclub/ui', async () => {
    const mod = await import('@kclub/ui');
    expect(typeof mod.Container).toBe('function');
  });

  test('imports Button from @kclub/ui', async () => {
    const mod = await import('@kclub/ui');
    expect(typeof mod.Button).toBe('function');
  });

  test('imports PageState from @kclub/ui', async () => {
    const mod = await import('@kclub/ui');
    expect(typeof mod.PageState).toBe('function');
  });

  test('imports cn from @kclub/ui', async () => {
    const mod = await import('@kclub/ui');
    expect(typeof mod.cn).toBe('function');
  });
});
