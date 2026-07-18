import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { createElement, type HTMLAttributes, type ReactNode } from 'react';

type MotionElementProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
};

function MotionElement({ children, ...props }: MotionElementProps) {
  const {
    // Motion-only props are intentionally omitted from the test DOM.
    initial: _initial,
    whileInView: _whileInView,
    viewport: _viewport,
    transition: _transition,
    variants: _variants,
    custom: _custom,
    ...htmlProps
  } = props as MotionElementProps & Record<string, unknown>;

  return createElement('div', htmlProps, children);
}

vi.mock('framer-motion', () => ({
  motion: {
    div: MotionElement,
    article: MotionElement,
  },
}));

import en from '../../messages/en.json';
import ru from '../../messages/ru.json';
import uk from '../../messages/uk.json';
import { ServicesSection } from '@/features/marketing/components/ServicesSection';

const MESSAGES_BY_LOCALE = { en, ru, uk } as const;

describe('ServicesSection', () => {
  afterEach(() => {
    cleanup();
  });

  test.each([
    ['en', 'Become a member', 'Become a partner'],
    ['ru', 'Стать участником', 'Стать партнёром'],
    ['uk', 'Стати учасником', 'Стати партнером'],
  ] as const)('renders both membership paths for %s', (locale, memberTitle, partnerTitle) => {
    render(
      <NextIntlClientProvider locale={locale} messages={MESSAGES_BY_LOCALE[locale]}>
        <ServicesSection locale={locale} />
      </NextIntlClientProvider>,
    );

    expect(document.getElementById('membership')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: memberTitle })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: partnerTitle })).toBeTruthy();

    const actions = screen.getAllByRole('link');
    expect(actions).toHaveLength(2);
    expect(actions.every((action) => action.getAttribute('href') === `/${locale}/sign-up`)).toBe(
      true,
    );
  });
});
