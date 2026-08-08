import { NextResponse } from 'next/server';

function getE2eSecret(): string | undefined {
  return process.env.E2E_TEST_SECRET;
}

type SeedRequestBody = {
  scenario: string;
  webhookEvent?: {
    type: string;
    data: Record<string, unknown>;
  };
};

type SeedResult = {
  userId?: string | undefined;
  phone?: string | undefined;
  cardNumber?: string | undefined;
  businessId?: string | undefined;
  businessSlug?: string | undefined;
  staffPhone?: string | undefined;
};

export async function POST(request: Request): Promise<Response> {
  const e2eSecret = getE2eSecret();
  // Guard: only available when E2E_TEST_SECRET is set
  if (!e2eSecret) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Not found' } },
      { status: 404 },
    );
  }

  // Verify secret header
  const secretHeader = request.headers.get('x-e2e-secret');
  if (secretHeader !== e2eSecret) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid secret' } },
      { status: 401 },
    );
  }

  const body = (await request.json()) as SeedRequestBody;
  const { scenario } = body;

  try {
    const result = await seedScenario(scenario, body.webhookEvent);

    // Clear the Next.js router cache so tests see the seeded data immediately
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/', 'layout');

    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { data: null, error: { code: 'SEED_FAILED', message } },
      { status: 500 },
    );
  }
}

async function seedScenario(
  scenario: string,
  _webhookEvent?: { type: string; data: Record<string, unknown> },
): Promise<SeedResult> {
  // Lazy import to avoid loading DB client when not needed
  const { getDbClient, schema } = await import('@/server/db');
  const { eq } = await import('drizzle-orm');
  const db = getDbClient();

  const timestamp = Date.now();
  const testPhone = `+1${timestamp.toString().slice(-10)}`;

  // Helper to get or create required relations for businesses
  const getBusinessRelations = async () => {
    let category = await db.query.categories.findFirst();
    if (!category) {
      [category] = await db
        .insert(schema.categories)
        .values({
          name: `E2E Category ${timestamp}`,
          slug: `e2e-category-${timestamp}`,
        })
        .returning();
    }

    let country = await db.query.countries.findFirst();
    if (!country) {
      [country] = await db
        .insert(schema.countries)
        .values({
          code2: 'US',
          name: 'United States',
          slug: 'united-states',
        })
        .returning();
    }

    let city = await db.query.cities.findFirst();
    if (!city) {
      [city] = await db
        .insert(schema.cities)
        .values({
          country_id: country!.id,
          name: 'New York',
          slug: 'new-york',
        })
        .returning();
    }

    return { categoryId: category!.id, countryId: country!.id, cityId: city!.id };
  };

  switch (scenario) {
    case 'stripe-webhook': {
      if (!_webhookEvent) {
        throw new Error('stripe-webhook scenario requires webhookEvent');
      }

      await applyStripeWebhook(_webhookEvent);
      return {};
    }

    case 'member-with-card': {
      const [user] = await db
        .insert(schema.users)
        .values({
          phone: testPhone,
          display_name: `E2E Member ${timestamp}`,
          locale_preference: 'en',
          terms_accepted_at: new Date(),
          status: 'ACTIVE',
          supabase_auth_user_id: crypto.randomUUID(),
        })
        .returning();

      const [card] = await db
        .insert(schema.memberCards)
        .values({
          user_id: user!.id,
          card_number: `MEM-${timestamp.toString().slice(-6)}`,
          membership_tier: 'MEMBER',
          status: 'ACTIVE',
          issued_at: new Date(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        })
        .returning();

      return {
        userId: user!.id,
        phone: testPhone,
        cardNumber: card!.card_number,
      };
    }

    case 'vip-member': {
      const [user] = await db
        .insert(schema.users)
        .values({
          phone: testPhone,
          display_name: `E2E VIP ${timestamp}`,
          locale_preference: 'en',
          terms_accepted_at: new Date(),
          status: 'ACTIVE',
          membership_tier: 'VIP',
          supabase_auth_user_id: crypto.randomUUID(),
        })
        .returning();

      await createActiveVipSubscription(user!.id, `vip-member-${timestamp}`);
      await createActiveCard(user!.id, 'VIP', `VIP-${timestamp.toString().slice(-6)}`);

      return { userId: user!.id, phone: testPhone };
    }

    case 'vip-with-business': {
      const [user] = await db
        .insert(schema.users)
        .values({
          phone: testPhone,
          display_name: `E2E VIP Biz ${timestamp}`,
          locale_preference: 'en',
          terms_accepted_at: new Date(),
          status: 'ACTIVE',
          membership_tier: 'VIP',
          supabase_auth_user_id: crypto.randomUUID(),
        })
        .returning();

      await createActiveVipSubscription(user!.id, `vip-business-${timestamp}`);
      await createActiveCard(user!.id, 'VIP', `VIP-${timestamp.toString().slice(-6)}`);

      const relations = await getBusinessRelations();

      const [business] = await db
        .insert(schema.businessProfiles)
        .values({
          user_id: user!.id,
          name: `E2E Business ${timestamp}`,
          slug: `e2e-business-${timestamp}`,
          representative_name: 'E2E Representative',
          representative_email: `e2e-${timestamp}@test.com`,
          representative_phone: testPhone,
          country_id: relations.countryId,
          city_id: relations.cityId,
          category_id: relations.categoryId,
          status: 'UNDER_REVIEW',
        })
        .returning();

      return {
        userId: user!.id,
        phone: testPhone,
        businessId: business!.id,
        businessSlug: business!.slug,
      };
    }

    case 'vip-with-published-business': {
      const [user] = await db
        .insert(schema.users)
        .values({
          phone: testPhone,
          display_name: `E2E VIP Published ${timestamp}`,
          locale_preference: 'en',
          terms_accepted_at: new Date(),
          status: 'ACTIVE',
          membership_tier: 'VIP',
          supabase_auth_user_id: crypto.randomUUID(),
        })
        .returning();

      await createActiveVipSubscription(user!.id, `vip-published-${timestamp}`);
      await createActiveCard(user!.id, 'VIP', `VIP-${timestamp.toString().slice(-6)}`);

      const relations = await getBusinessRelations();

      const [business] = await db
        .insert(schema.businessProfiles)
        .values({
          user_id: user!.id,
          name: `E2E Published Business ${timestamp}`,
          slug: `e2e-published-${timestamp}`,
          representative_name: 'E2E Rep',
          representative_email: `e2e-pub-${timestamp}@test.com`,
          representative_phone: testPhone,
          country_id: relations.countryId,
          city_id: relations.cityId,
          category_id: relations.categoryId,
          status: 'PUBLISHED',
        })
        .returning();

      return {
        userId: user!.id,
        phone: testPhone,
        businessId: business!.id,
        businessSlug: business!.slug,
      };
    }

    case 'business-with-incoming-introduction': {
      // Business owner (target) who signs in and sees an APPROVED incoming
      // recommendation in the "Входящие рекомендации" cabinet tab.
      const [owner] = await db
        .insert(schema.users)
        .values({
          phone: testPhone,
          display_name: `E2E Intro Owner ${timestamp}`,
          locale_preference: 'en',
          terms_accepted_at: new Date(),
          status: 'ACTIVE',
          membership_tier: 'VIP',
          supabase_auth_user_id: crypto.randomUUID(),
        })
        .returning();

      await createActiveVipSubscription(owner!.id, `vip-intro-${timestamp}`);
      await createActiveCard(owner!.id, 'VIP', `VIP-${timestamp.toString().slice(-6)}`);

      const relations = await getBusinessRelations();

      const [business] = await db
        .insert(schema.businessProfiles)
        .values({
          user_id: owner!.id,
          name: `E2E Intro Business ${timestamp}`,
          slug: `e2e-intro-${timestamp}`,
          representative_name: 'E2E Rep',
          representative_email: `e2e-intro-${timestamp}@test.com`,
          representative_phone: testPhone,
          country_id: relations.countryId,
          city_id: relations.cityId,
          category_id: relations.categoryId,
          status: 'PUBLISHED',
        })
        .returning();

      // Requester (the introducer) — surfaces as requesterDisplayName on the card.
      const [requester] = await db
        .insert(schema.users)
        .values({
          phone: `+1${(timestamp + 1).toString().slice(-10)}`,
          display_name: `E2E Intro Requester ${timestamp}`,
          locale_preference: 'en',
          terms_accepted_at: new Date(),
          status: 'ACTIVE',
          supabase_auth_user_id: crypto.randomUUID(),
        })
        .returning();

      await db.insert(schema.businessIntroductions).values({
        requester_user_id: requester!.id,
        target_business_id: business!.id,
        // APPROVED = admin already moderated; owner now sees Complete/Reject actions.
        status: 'APPROVED',
        client_name: 'E2E Client Name',
        client_contact: '+1 555 010 2030',
        message: 'E2E incoming recommendation message',
      });

      return {
        userId: owner!.id,
        phone: testPhone,
        businessId: business!.id,
        businessSlug: business!.slug,
      };
    }

    case 'staff-owner': {
      // Staff users come from ADMIN_STAFF_ALLOWLIST_JSON env var
      // Return the bootstrap owner phone for login
      return {
        staffPhone: process.env.ADMIN_BOOTSTRAP_OWNER_PHONE ?? '+10000000000',
      };
    }

    case 'staff-db-owner': {
      const { hashStaffPassword } = await import('@/server/staff-password');

      const [staff] = await db
        .insert(schema.adminUsers)
        .values({
          phone: testPhone,
          role: 'OWNER',
          display_name: `E2E Staff Owner ${timestamp}`,
          is_active: true,
          password_hash: await hashStaffPassword('E2eStaffPass123!'),
          password_set_at: new Date(),
        })
        .returning();

      return {
        staffPhone: staff!.phone,
      };
    }

    case 'staff-moderator': {
      return {
        staffPhone: process.env.ADMIN_BOOTSTRAP_OWNER_PHONE ?? '+10000000000',
      };
    }

    case 'published-businesses': {
      const relations = await getBusinessRelations();

      const businesses = await Promise.all(
        ['Alpha', 'Beta', 'Gamma'].map(async (name, i) => {
          const [owner] = await db
            .insert(schema.users)
            .values({
              phone: `+1${(timestamp + i).toString().slice(-10)}`,
              display_name: `E2E Directory Owner ${name} ${timestamp}`,
              locale_preference: 'en',
              terms_accepted_at: new Date(),
              status: 'ACTIVE',
              membership_tier: 'VIP',
              supabase_auth_user_id: crypto.randomUUID(),
            })
            .returning();

          const [bp] = await db
            .insert(schema.businessProfiles)
            .values({
              user_id: owner!.id,
              name: `E2E ${name} Business`,
              slug: `e2e-${name.toLowerCase()}-${timestamp}`,
              representative_name: `${name} Rep`,
              representative_email: `e2e-${name.toLowerCase()}-${timestamp}@test.com`,
              representative_phone: owner!.phone,
              country_id: relations.countryId,
              city_id: relations.cityId,
              category_id: relations.categoryId,
              status: 'PUBLISHED',
            })
            .returning();
          return bp;
        }),
      );

      return {
        userId: businesses[0]?.user_id,
        phone: testPhone, // Note: We might need to return the first owner's phone for login tests
        businessId: businesses[0]?.id,
        businessSlug: businesses[0]?.slug,
      };
    }

    default:
      throw new Error(`Unknown seed scenario: ${scenario}`);
  }

  async function createActiveCard(
    userId: string,
    membershipTier: 'MEMBER' | 'VIP',
    cardNumber: string,
  ): Promise<void> {
    await db.insert(schema.memberCards).values({
      user_id: userId,
      card_number: cardNumber,
      membership_tier: membershipTier,
      status: 'ACTIVE',
      issued_at: new Date(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
  }

  async function createActiveVipSubscription(userId: string, suffix: string): Promise<void> {
    await db.insert(schema.vipSubscriptions).values({
      user_id: userId,
      status: 'ACTIVE',
      stripe_customer_id: `cus_e2e_${suffix}`,
      stripe_subscription_id: `sub_e2e_${suffix}`,
      stripe_price_id: 'price_e2e_vip',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
  }

  async function applyStripeWebhook(webhookEvent: {
    type: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    if (webhookEvent.type !== 'checkout.session.completed') {
      throw new Error(`Unsupported test webhook event: ${webhookEvent.type}`);
    }

    const rawObject = webhookEvent.data.object;
    if (!rawObject || typeof rawObject !== 'object') {
      throw new Error('Stripe webhook object is required');
    }

    const checkoutSession = rawObject as {
      customer?: string;
      subscription?: string;
      metadata?: {
        userId?: string;
        businessProfileId?: string;
        type?: string;
      };
    };

    const metadata = checkoutSession.metadata;
    const subscriptionId = checkoutSession.subscription ?? `sub_e2e_${timestamp}`;
    const customerId = checkoutSession.customer ?? `cus_e2e_${timestamp}`;

    if (metadata?.type === 'vip' && metadata.userId) {
      const userId = metadata.userId;
      await db.transaction(async (tx) => {
        await tx
          .update(schema.users)
          .set({ membership_tier: 'VIP' })
          .where(eq(schema.users.id, userId));

        await tx
          .insert(schema.vipSubscriptions)
          .values({
            user_id: userId,
            status: 'ACTIVE',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: 'price_e2e_vip',
            current_period_start: new Date(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          })
          .onConflictDoUpdate({
            target: schema.vipSubscriptions.stripe_subscription_id,
            set: {
              status: 'ACTIVE',
              current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          });
      });
      return;
    }

    if (metadata?.type === 'placement' && metadata.userId && metadata.businessProfileId) {
      const userId = metadata.userId;
      const businessProfileId = metadata.businessProfileId;
      await db.transaction(async (tx) => {
        await tx
          .update(schema.businessProfiles)
          .set({ status: 'PUBLISHED', published_at: new Date() })
          .where(eq(schema.businessProfiles.id, businessProfileId));

        await tx
          .insert(schema.subscriptions)
          .values({
            user_id: userId,
            business_profile_id: businessProfileId,
            kind: 'BUSINESS_PLACEMENT',
            status: 'ACTIVE',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: 'price_e2e_business',
            current_period_start: new Date(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          })
          .onConflictDoUpdate({
            target: schema.subscriptions.stripe_subscription_id,
            set: {
              status: 'ACTIVE',
              current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          });
      });
      return;
    }

    throw new Error('Unsupported checkout.session.completed metadata for E2E webhook');
  }
}
