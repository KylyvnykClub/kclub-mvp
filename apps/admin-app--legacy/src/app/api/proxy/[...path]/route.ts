import { NextRequest, NextResponse } from 'next/server';

import { readStaffSession } from '@/server/auth/session';
import { createLogger } from '@/server/logger';

const ADMIN_API_PREFIX = '/api/admin/v1';

function getUpstreamBase(): string {
  return (
    process.env.PRODUCT_CORE_API_BASE_URL ??
    process.env.PRODUCT_CORE_ADMIN_API_URL ??
    'http://localhost:3000'
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path, 'DELETE');
}

async function proxy(request: NextRequest, path: string[], method: string) {
  const log = createLogger();

  const session = await readStaffSession();
  if (!session?.token) {
    log.auth('Proxy rejected: no staff session', { path: `/${path.join('/')}`, method });
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHENTICATED', message: 'No staff session' } },
      { status: 401 },
    );
  }

  const upstreamPath = `/${path.join('/')}`;
  const searchParams = request.nextUrl.searchParams.toString();
  const upstreamUrl = `${getUpstreamBase()}${ADMIN_API_PREFIX}${upstreamPath}${searchParams ? `?${searchParams}` : ''}`;

  const body = method !== 'GET' && method !== 'HEAD' ? await request.text() : undefined;

  const response = await fetch(upstreamUrl, {
    method,
    headers: {
      authorization: `Bearer ${session.token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body,
  });

  const responseBody = await response.text();

  if (!response.ok) {
    log.proxy('Upstream API returned error', {
      path: upstreamPath,
      method,
      status: response.status,
    });
  }

  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      'content-type': 'application/json',
    },
  });
}
