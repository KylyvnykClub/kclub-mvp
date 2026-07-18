import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import en from '../../messages/en.json';
import ru from '../../messages/ru.json';
import uk from '../../messages/uk.json';
import { FaqSection } from '@/features/marketing/components/FaqSection';

const MESSAGES_BY_LOCALE = { en, ru, uk } as const;

describe('FaqSection', () => {
  afterEach(() => {
    cleanup();
  });

  test.each([
    ['en', 'Frequently Asked Questions', 'What is KYLYVNYK CLUB?'],
    ['ru', 'Часто задаваемые вопросы', 'Что такое KYLYVNYK CLUB?'],
    ['uk', 'Часті запитання', 'Що таке KYLYVNYK CLUB?'],
  ] as const)('renders the localized FAQ content for %s', (locale, title, firstQuestion) => {
    render(
      <NextIntlClientProvider locale={locale} messages={MESSAGES_BY_LOCALE[locale]}>
        <FaqSection />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { level: 2, name: title })).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(16);
    expect(screen.getByRole('button', { name: firstQuestion }).getAttribute('aria-expanded')).toBe(
      'true',
    );
    expect(screen.getAllByRole('region')).toHaveLength(1);
  });

  test('updates the accessible state when another answer opens', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <FaqSection />
      </NextIntlClientProvider>,
    );

    const firstButton = screen.getByRole('button', { name: 'What is KYLYVNYK CLUB?' });
    const secondButton = screen.getByRole('button', { name: 'Who can become a member?' });

    fireEvent.click(secondButton);

    expect(firstButton.getAttribute('aria-expanded')).toBe('false');
    expect(secondButton.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('faq-panel-0')?.getAttribute('aria-hidden')).toBe('true');
    expect(document.getElementById('faq-panel-1')?.getAttribute('aria-hidden')).toBe('false');
  });
});
