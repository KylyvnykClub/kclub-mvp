import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import en from '../../messages/en.json';
import ru from '../../messages/ru.json';
import uk from '../../messages/uk.json';
import { AboutSection } from '@/features/marketing/components/AboutSection';

const MESSAGES_BY_LOCALE = { en, ru, uk } as const;

describe('AboutSection', () => {
  afterEach(() => {
    cleanup();
  });

  test.each([
    ['en', 'An international community built on trust'],
    ['ru', 'Международное сообщество, основанное на доверии'],
    ['uk', 'Міжнародна спільнота, заснована на довірі'],
  ] as const)('renders the S1 content for %s', (locale, title) => {
    render(
      <NextIntlClientProvider locale={locale} messages={MESSAGES_BY_LOCALE[locale]}>
        <AboutSection />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('region', { name: title }).getAttribute('id')).toBe('about');
    expect(screen.getByRole('heading', { level: 2, name: title })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(9);
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getAllByRole('listitem')).toHaveLength(9);
  });
});
