import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import ErrorBoundary from '@/app/[locale]/error';

const messages = {
  title: 'Service temporarily unavailable',
  description: 'We could not load the data right now. Please try again in a few minutes.',
  retry: 'Try again',
} as const;

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

afterEach(() => {
  cleanup();
});

describe('localized error boundary', () => {
  test('renders a safe service unavailable message without exposing the error', () => {
    render(
      <ErrorBoundary
        error={new Error('column businessProfiles.public_phone does not exist')}
        reset={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: messages.title })).toBeTruthy();
    expect(screen.getByText(messages.description)).toBeTruthy();
    expect(screen.queryByText(/public_phone/)).toBeNull();
  });

  test('retries the failed route segment', () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error('Database unavailable')} reset={reset} />);

    fireEvent.click(screen.getByRole('button', { name: messages.retry }));

    expect(reset).toHaveBeenCalledOnce();
  });
});
