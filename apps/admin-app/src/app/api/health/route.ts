import { NextResponse } from 'next/server';

type BackendStatus = 'ok' | 'degraded' | 'unreachable';

async function checkBackend(): Promise<BackendStatus> {
  const baseUrl =
    process.env.PRODUCT_CORE_API_BASE_URL ??
    process.env.PRODUCT_CORE_ADMIN_API_URL ??
    'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return 'degraded';
    const body = await res.json();
    return body?.data?.status === 'ok' ? 'ok' : 'degraded';
  } catch {
    return 'unreachable';
  }
}

export async function GET() {
  const backend = await checkBackend();
  return NextResponse.json({
    status: backend === 'ok' ? 'ok' : 'degraded',
    app: 'admin-app',
    dependencies: { backend },
  });
}
