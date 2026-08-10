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

function getDeviceClass(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window.matchMedia !== 'function') {
    return 'desktop';
  }

  if (window.matchMedia('(max-width: 767px)').matches) {
    return 'mobile';
  }

  if (window.matchMedia('(max-width: 1023px)').matches) {
    return 'tablet';
  }

  return 'desktop';
}

function reportWebVital(metric: CoreWebVitalMetric): void {
  if (!CORE_WEB_VITAL_NAMES.has(metric.name) || typeof window.plausible !== 'function') {
    return;
  }

  const deployment = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

  window.plausible('WebVital', {
    interactive: false,
    props: {
      metric: metric.name,
      rating: metric.rating,
      value: String(Math.round(metric.value * 1000) / 1000),
      route: window.location.pathname,
      device: getDeviceClass(),
      ...(deployment ? { deployment } : {}),
    },
  });
}

export function WebVitals(): null {
  useReportWebVitals(reportWebVital);

  return null;
}
