import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isConfigured = dsn && !dsn.includes('REPLACE_ME');

Sentry.init({
  dsn: isConfigured ? dsn : undefined,
  enabled: process.env.NODE_ENV === 'production' && !!isConfigured,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});
