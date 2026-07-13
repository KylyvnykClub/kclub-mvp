import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import en from '../../messages/en.json';
import ru from '../../messages/ru.json';
import uk from '../../messages/uk.json';
import { PrinciplesSection } from '@/features/marketing/components/PrinciplesSection';

const MESSAGES_BY_LOCALE = { en, ru, uk } as const;
const ORDERED_NUMBERS = ['01', '02', '03', '04', '05'];

describe('PrinciplesSection', () => {
  afterEach(() => {
    cleanup();
  });

  test.each([
    ['en', 'Our principles'],
    ['ru', 'Наши принципы'],
    ['uk', 'Наші принципи'],
  ] as const)('renders the localized principles for %s', (locale, title) => {
    render(
      <NextIntlClientProvider locale={locale} messages={MESSAGES_BY_LOCALE[locale]}>
        <PrinciplesSection />
      </NextIntlClientProvider>,
    );

    const section = screen.getByRole('region', { name: title });
    const list = within(section).getByRole('list');
    const items = within(list).getAllByRole('listitem');

    expect(section.getAttribute('id')).toBe('principles');
    expect(within(section).getByRole('heading', { level: 2, name: title })).toBeTruthy();
    expect(within(section).getAllByRole('heading', { level: 3 })).toHaveLength(5);
    expect(items).toHaveLength(5);
    expect(within(section).queryAllByRole('img')).toHaveLength(0);
    expect(items.map((item) => within(item).getByText(/^\d{2}$/).textContent)).toEqual(
      ORDERED_NUMBERS,
    );
  });
});
