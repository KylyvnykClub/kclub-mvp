import { describe, expect, test } from 'vitest';

import { locales, defaultLocale, isLocale, stripLocalePrefix } from '@/i18n/routing';

describe('i18n routing config', () => {
  test('exports expected locales', () => {
    expect(locales).toEqual(['en', 'ru', 'uk']);
  });

  test('default locale is en', () => {
    expect(defaultLocale).toBe('en');
  });
});

describe('isLocale', () => {
  test('returns true for valid locales', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('ru')).toBe(true);
    expect(isLocale('uk')).toBe(true);
  });

  test('returns false for invalid locales', () => {
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('de')).toBe(false);
    expect(isLocale('')).toBe(false);
    expect(isLocale('EN')).toBe(false);
    expect(isLocale('Ru')).toBe(false);
  });

  test('narrows type when true', () => {
    const value: string = 'en';
    if (isLocale(value)) {
      const locale: 'en' | 'ru' | 'uk' = value;
      expect(locale).toBe('en');
    }
  });
});

describe('stripLocalePrefix', () => {
  test('removes locale from home paths', () => {
    expect(stripLocalePrefix('/ru')).toBe('/');
    expect(stripLocalePrefix('/uk')).toBe('/');
    expect(stripLocalePrefix('/en')).toBe('/');
  });

  test('removes locale from nested paths', () => {
    expect(stripLocalePrefix('/ru/directory')).toBe('/directory');
    expect(stripLocalePrefix('/uk/m/dashboard')).toBe('/m/dashboard');
  });

  test('returns pathname unchanged when no locale prefix is present', () => {
    expect(stripLocalePrefix('/')).toBe('/');
    expect(stripLocalePrefix('/directory')).toBe('/directory');
  });
});
