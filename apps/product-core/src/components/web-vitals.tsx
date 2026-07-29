'use client';

import { useReportWebVitals } from 'next/web-vitals';

type CoreWebVitalMetric = {
  name: string;
  rating: string;
  value: number;
};

type PlausibleOptions = {
  interactive: boolean;
  props: Record<string, string>;
};

declare global {
  interface Window {
    plausible?: (eventName: string, options: PlausibleOptions) => void;
  }
}

const CORE_WEB_VITAL_NAMES = new Set(['LCP', 'CLS', 'INP']);

function reportWebVital(metric: CoreWebVitalMetric): void {
  if (!CORE_WEB_VITAL_NAMES.has(metric.name) || typeof window.plausible !== 'function') {
    return;
  }

  window.plausible('WebVital', {
    interactive: false,
    props: {
      metric: metric.name,
      rating: metric.rating,
      value: String(Math.round(metric.value * 1000) / 1000),
    },
  });
}

export function WebVitals(): null {
  useReportWebVitals(reportWebVital);

  return null;
}
