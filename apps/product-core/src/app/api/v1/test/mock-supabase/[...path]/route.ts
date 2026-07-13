import { NextResponse } from 'next/server';
import { getDbClient, schema } from '@/server/db';
import { eq } from 'drizzle-orm';

function getE2eSecret(): string | undefined {
  return process.env.E2E_TEST_SECRET;
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!getE2eSecret()) {
    return NextResponse.json({ error: 'Mock only available in E2E' }, { status: 404 });
  }

  const { path } = await params;
  const endpoint = path.join('/');

  if (endpoint === 'auth/v1/otp') {
    return NextResponse.json({ message_id: 'e2e-mock-message-id' });
  }

  if (endpoint === 'auth/v1/verify') {
    const body = await request.json();
    const phone = body.phone;

    if (body.token === '000000') {
      // Look up member by phone to get the correct supabase_auth_user_id for seeded
      // tests — getMemberBySupabaseUserId() looks up users by that column, not by
      // the primary key, so the mocked session must return the same UUID. For a
      // brand-new sign-up (no existing member yet), mint a fresh UUID each time —
      // a fixed constant collides with the unique constraint on that column as
      // soon as a second new phone signs up in the same test database.
      let mockUserId = crypto.randomUUID();
      try {
        const db = getDbClient();
        const existingMember = await db.query.users.findFirst({
          where: eq(schema.users.phone, phone),
        });
        if (existingMember?.supabase_auth_user_id) {
          mockUserId = existingMember.supabase_auth_user_id;
        }
      } catch (e) {
        console.error('Failed to look up member in mock', e);
      }

      return NextResponse.json({
        access_token: `e2e-mock-access-token-${mockUserId}`,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'e2e-mock-refresh-token',
        user: {
          id: mockUserId,
          phone: phone,
          role: 'authenticated',
          aud: 'authenticated',
          app_metadata: { provider: 'phone' },
          user_metadata: {},
        },
      });
    }

    return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
  }

  return NextResponse.json({ error: 'Not implemented mock' }, { status: 404 });
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!getE2eSecret()) {
    return NextResponse.json({ error: 'Mock only available in E2E' }, { status: 404 });
  }

  const { path } = await params;
  const endpoint = path.join('/');

  if (endpoint === 'auth/v1/user') {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer e2e-mock-access-token-')) {
      const extractedId = authHeader.replace('Bearer e2e-mock-access-token-', '');
      return NextResponse.json({
        id: extractedId,
        phone: '+15551234567', // Not strictly needed if ID is correct
        role: 'authenticated',
        aud: 'authenticated',
        app_metadata: { provider: 'phone' },
        user_metadata: {},
      });
    }
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  return NextResponse.json({ error: 'Not implemented mock' }, { status: 404 });
}
