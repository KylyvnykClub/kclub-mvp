import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

import { routing } from '@/i18n/routing';

const handleI18nRouting = createIntlMiddleware(routing);

function generateRequestId(): string {
  return crypto.randomUUID();
}

function withRequestHeaders(request: NextRequest): NextRequest {
  const requestHeaders = new Headers(request.headers);

  if (!requestHeaders.has('x-request-id')) {
    requestHeaders.set('x-request-id', generateRequestId());
  }

  requestHeaders.set('x-kclub-pathname', request.nextUrl.pathname);

  return new NextRequest(request, { headers: requestHeaders });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith('/api/');
  const isLegalRoute = pathname.startsWith('/legal/');
  const isAssetRoute =
    pathname.startsWith('/_next/') || pathname === '/favicon.ico' || pathname === '/robots.txt';

  if (isApiRoute || isLegalRoute) {
    return NextResponse.next({
      request: {
        headers: withRequestHeaders(request).headers,
      },
    });
  }

  if (isAssetRoute) {
    return;
  }

  return handleI18nRouting(withRequestHeaders(request));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
