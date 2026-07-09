import { NextResponse } from 'next/server';

function getE2eSecret(): string | undefined {
  return process.env.E2E_TEST_SECRET;
}

export async function POST(request: Request): Promise<Response> {
  const e2eSecret = getE2eSecret();
  if (!e2eSecret) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Not found' } },
      { status: 404 },
    );
  }

  const secretHeader = request.headers.get('x-e2e-secret');
  if (secretHeader !== e2eSecret) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid secret' } },
      { status: 401 },
    );
  }

  try {
    const { getDbClient, schema } = await import('@/server/db');
    const db = getDbClient();
    const { like, or, inArray } = await import('drizzle-orm');

    // Delete E2E test data by convention: display names starting with "E2E "
    // Order matters due to foreign key constraints
    await db
      .delete(schema.subscriptions)
      .where(
        or(
          inArray(
            schema.subscriptions.user_id,
            db
              .select({ id: schema.users.id })
              .from(schema.users)
              .where(like(schema.users.display_name, 'E2E %')),
          ),
          inArray(
            schema.subscriptions.business_profile_id,
            db
              .select({ id: schema.businessProfiles.id })
              .from(schema.businessProfiles)
              .where(like(schema.businessProfiles.name, 'E2E %')),
          ),
          like(schema.subscriptions.stripe_subscription_id, 'sub_e2e_%'),
        ),
      );
    await db
      .delete(schema.vipSubscriptions)
      .where(
        or(
          inArray(
            schema.vipSubscriptions.user_id,
            db
              .select({ id: schema.users.id })
              .from(schema.users)
              .where(like(schema.users.display_name, 'E2E %')),
          ),
          like(schema.vipSubscriptions.stripe_subscription_id, 'sub_e2e_%'),
        ),
      );
    await db
      .delete(schema.businessIntroductions)
      .where(
        inArray(
          schema.businessIntroductions.target_business_id,
          db
            .select({ id: schema.businessProfiles.id })
            .from(schema.businessProfiles)
            .where(like(schema.businessProfiles.name, 'E2E %')),
        ),
      );
    await db.delete(schema.businessProfiles).where(like(schema.businessProfiles.name, 'E2E %'));
    await db
      .delete(schema.memberCards)
      .where(
        inArray(
          schema.memberCards.user_id,
          db
            .select({ id: schema.users.id })
            .from(schema.users)
            .where(like(schema.users.display_name, 'E2E %')),
        ),
      );
    await db.delete(schema.users).where(like(schema.users.display_name, 'E2E %'));

    return NextResponse.json({ data: { cleaned: true }, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { data: null, error: { code: 'TEARDOWN_FAILED', message } },
      { status: 500 },
    );
  }
}
