import { afterEach, describe, expect, test } from 'vitest';

import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

import Loading from '@/app/[locale]/loading';

describe('Loading component smoke', () => {
  test('renders without crashing', () => {
    const { container } = render(<Loading />);
    expect(container).toBeTruthy();
  });

  test('renders sr-only loading text', () => {
    render(<Loading />);
    const srText = screen.getByText('Loading...');
    expect(srText).toBeTruthy();
    expect(srText.className).toContain('sr-only');
  });

  test('renders spinner icon', () => {
    const { container } = render(<Loading />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });
});
