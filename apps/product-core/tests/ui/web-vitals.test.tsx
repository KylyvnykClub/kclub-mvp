import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

type WebVitalMetric = {
  name: string;
  rating: string;
  value: number;
};

type WebVitalsReporter = {
  callback: ((metric: WebVitalMetric) => void) | undefined;
};

const reporter = vi.hoisted<WebVitalsReporter>(() => ({ callback: undefined }));

vi.mock('next/web-vitals', () => ({
  useReportWebVitals: (callback: (metric: WebVitalMetric) => void) => {
    reporter.callback = callback;
  },
}));

import { WebVitals } from '@/components/web-vitals';

afterEach(() => {
  cleanup();
  reporter.callback = undefined;
  delete window.plausible;
});

describe('WebVitals', () => {
  test('should report LCP, CLS, and INP metrics to Plausible', () => {
    const plausible = vi.fn();
    window.plausible = plausible;

    render(<WebVitals />);

    if (!reporter.callback) {
      throw new Error('Expected WebVitals to register a reporter callback');
    }

    const callback = reporter.callback;
    callback({ name: 'LCP', rating: 'good', value: 1234.5678 });
    callback({ name: 'CLS', rating: 'needs-improvement', value: 0.12345 });
    callback({ name: 'INP', rating: 'poor', value: 321.9876 });

    expect(plausible).toHaveBeenNthCalledWith(
      1,
      'WebVital',
      expect.objectContaining({
        interactive: false,
        props: expect.objectContaining({
          metric: 'LCP',
          rating: 'good',
          value: '1234.568',
          route: window.location.pathname,
          device: 'desktop',
        }),
      }),
    );
    expect(plausible).toHaveBeenNthCalledWith(
      2,
      'WebVital',
      expect.objectContaining({ props: expect.objectContaining({ metric: 'CLS' }) }),
    );
    expect(plausible).toHaveBeenNthCalledWith(
      3,
      'WebVital',
      expect.objectContaining({ props: expect.objectContaining({ metric: 'INP' }) }),
    );
  });

  test('should ignore non-core metrics and unavailable Plausible', () => {
    render(<WebVitals />);

    if (!reporter.callback) {
      throw new Error('Expected WebVitals to register a reporter callback');
    }

    const callback = reporter.callback;

    expect(() => callback({ name: 'FCP', rating: 'good', value: 500 })).not.toThrow();
    expect(() => callback({ name: 'LCP', rating: 'good', value: 1200 })).not.toThrow();
  });
});
