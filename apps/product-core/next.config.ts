import type { NextConfig } from 'next';
import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://plausible.io",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com https://plausible.io https://*.supabase.co https://*.upstash.io",
      "frame-src https://js.stripe.com https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  } : {}),
  transpilePackages: ['@kclub/ui'],
  serverExternalPackages: ['pino', 'pino-pretty', '@kclub/database'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  ...(process.env.VERCEL ? {
    outputFileTracingIncludes: {
      '/(.*)': [
        '../../packages/database/src/generated/**/*',
      ],
    },
  } : {}),

  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
