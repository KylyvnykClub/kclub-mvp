import { and, eq, inArray, not, sql } from 'drizzle-orm';
import { getDbClient, schema } from '../index.js';
import {
  ADMIN_BOOTSTRAP_PLAN,
  BUSINESS_TAXONOMY_SEED_PLAN,
  CATEGORY_SEED_PLAN,
  CITY_SEED_PLAN,
  CONFIG_SEED_PLAN,
  COUNTRY_SEED_PLAN,
} from './seed-plan.js';
import { hashSeedPassword } from './password.js';

const DEMO_BUSINESSES = [
  {
    userPhone: '+15551000001',
    userDisplayName: 'Skyline Partner',
    slug: 'skyline-hospitality-group',
    name: 'Skyline Hospitality Group',
    representativeName: 'Alex Morgan',
    representativeEmail: 'alex@skyline-hospitality.example',
    representativePhone: '+15551000001',
    categorySlug: 'hospitality-education-and-personal-services-hotels-and-apartments-hotels',
    countrySlug: 'united-states',
    citySlug: 'new-york',
    briefDescription: 'Boutique hotels and private dining for members.',
    featuredTop: true,
    featuredRecommended: false,
    memberDiscountPercent: 10,
  },
  {
    userPhone: '+15551000002',
    userDisplayName: 'Wellness Collective',
    slug: 'wellness-collective-miami',
    name: 'Wellness Collective Miami',
    representativeName: 'Jordan Lee',
    representativeEmail: 'hello@wellness-collective.example',
    representativePhone: '+15551000002',
    categorySlug: 'beauty-fitness-and-recovery-spa-and-wellness-individual-service',
    countrySlug: 'united-states',
    citySlug: 'miami',
    briefDescription: 'Concierge wellness, recovery, and longevity programs.',
    featuredTop: false,
    featuredRecommended: true,
    memberDiscountPercent: 20,
  },
  {
    userPhone: '+15551000003',
    userDisplayName: 'Legal Advisory',
    slug: 'harbor-legal-advisors',
    name: 'Harbor Legal Advisors',
    representativeName: 'Taylor Brooks',
    representativeEmail: 'team@harbor-legal.example',
    representativePhone: '+15551000003',
    categorySlug: 'legal-finance-and-security-law-firms-and-attorneys-consultations',
    countrySlug: 'united-states',
    citySlug: 'los-angeles',
    briefDescription: 'Cross-border legal counsel for founders and families.',
    featuredTop: false,
    featuredRecommended: false,
    memberDiscountPercent: null,
  },
  {
    userPhone: '+44201000001',
    userDisplayName: 'Regent Executive Concierge',
    slug: 'regent-executive-concierge',
    name: 'Regent Executive Concierge',
    representativeName: 'James Whitmore',
    representativeEmail: 'contact@regent-concierge.example',
    representativePhone: '+44201000001',
    categorySlug: 'business-and-professional-services-business-consulting-consultation',
    countrySlug: 'united-kingdom',
    citySlug: 'london',
    briefDescription:
      'Bespoke high-touch lifestyle solutions, Michelin star bookings, private island access, and luxury experiences across the UK and Continental Europe.',
    description:
      'Regent Executive Concierge is the premier lifestyle management service for ultra-high-net-worth individuals across the United Kingdom and Europe. Our dedicated team handles everything from exclusive Michelin-starred restaurant reservations and private jet coordination to last-minute luxury hotel suites and curated island retreats. Members enjoy 24/7 personal concierge support, priority access to sold-out cultural events, and bespoke travel planning tailored to exacting standards.',
    featuredTop: true,
    featuredRecommended: false,
    memberDiscountPercent: 15,
  },
  {
    userPhone: '+41221000001',
    userDisplayName: 'Prestige Capital Advisory',
    slug: 'prestige-capital-advisory',
    name: 'Prestige Capital Advisory',
    representativeName: 'Dominique Fontaine',
    representativeEmail: 'advisory@prestige-capital.example',
    representativePhone: '+41221000001',
    categorySlug: 'legal-finance-and-security-immigration-law-investment-immigration',
    countrySlug: 'switzerland',
    citySlug: 'geneva',
    briefDescription:
      'Swiss private registry investment consultants. Specialized in international asset protection, structure management, and generational wealth transitions.',
    description:
      'Prestige Capital Advisory is a boutique Geneva-based family office consultancy serving the complex financial needs of international private clients. We specialise in cross-border asset protection structures, trust and foundation governance, and discreet generational wealth transition planning. With deep expertise in Swiss and Liechtenstein legal frameworks, we deliver confidential, independent counsel to families, entrepreneurs, and private institutions.',
    featuredTop: true,
    featuredRecommended: false,
    memberDiscountPercent: 10,
  },
  {
    userPhone: '+37793000001',
    userDisplayName: 'Monaco Sail Experience',
    slug: 'monaco-sail-experience',
    name: 'Monaco Sail Experience',
    representativeName: 'Pierre Beaumont',
    representativeEmail: 'charter@monaco-sail.example',
    representativePhone: '+37793000001',
    categorySlug:
      'hospitality-education-and-personal-services-travel-agencies-and-tour-operators-custom-tours',
    countrySlug: 'monaco',
    citySlug: 'monaco',
    briefDescription:
      'Ultimate Mediterranean yachting. Private luxury day cruises, elite cocktail receptions in the Port de Monaco, and access to a premium motor-yacht fleet.',
    description:
      'Monaco Sail Experience is the finest yachting charter operator in the principality of Monaco, offering an unrivalled portfolio of superyachts and motor-yachts for private day cruises and multi-day Mediterranean voyages. Our services extend from intimate sunset cocktail receptions at the Port Hercule to fully crewed corporate events and VIP birthday charters. Every voyage is curated by our master captain, with bespoke catering by Michelin-trained private chefs.',
    featuredTop: true,
    featuredRecommended: false,
    memberDiscountPercent: 12,
  },
] as const;

function chunkArray<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function isTruthyFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '').trim();
}

async function seedReferenceData(db: ReturnType<typeof getDbClient>): Promise<void> {
  for (const country of COUNTRY_SEED_PLAN) {
    const existing = await db
      .select()
      .from(schema.countries)
      .where(eq(schema.countries.slug, country.slug))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(schema.countries)
        .set({
          code2: country.code2,
          code3: country.code3,
          name: country.name,
          is_active: true,
        })
        .where(eq(schema.countries.slug, country.slug));
    } else {
      await db.insert(schema.countries).values({
        code2: country.code2,
        code3: country.code3,
        name: country.name,
        slug: country.slug,
        is_active: true,
      });
    }
  }

  const countriesList = await db.select().from(schema.countries);
  const countryBySlug = new Map(countriesList.map((country) => [country.slug, country]));

  const cityValues = CITY_SEED_PLAN.map((city) => {
    const country = countryBySlug.get(city.countrySlug);
    if (!country) {
      throw new Error(`Missing country for city seed: ${city.countrySlug}`);
    }

    return {
      country_id: country.id,
      name: city.name,
      slug: city.slug,
      is_active: true,
    };
  });

  for (const cityBatch of chunkArray(cityValues, 1000)) {
    await db
      .insert(schema.cities)
      .values(cityBatch)
      .onConflictDoUpdate({
        target: [schema.cities.country_id, schema.cities.slug],
        set: {
          name: sql.raw(`excluded.${schema.cities.name.name}`),
          is_active: true,
        },
      });
  }

  const activeTaxonomySlugs = new Set<string>();
  const blockSortOrder = new Map<string, number>();
  const categorySortOrder = new Map<string, number>();
  const subcategorySortOrder = new Map<string, number>();

  for (const item of BUSINESS_TAXONOMY_SEED_PLAN) {
    if (!blockSortOrder.has(item.blockSlug))
      blockSortOrder.set(item.blockSlug, blockSortOrder.size + 1);
    if (!categorySortOrder.has(item.categorySlug)) {
      categorySortOrder.set(item.categorySlug, categorySortOrder.size + 1);
    }
    subcategorySortOrder.set(item.subcategorySlug, subcategorySortOrder.size + 1);
    activeTaxonomySlugs.add(item.blockSlug);
    activeTaxonomySlugs.add(item.categorySlug);
    activeTaxonomySlugs.add(item.subcategorySlug);
  }

  const upsertCategoryNode = async ({
    parentId,
    level,
    name,
    slug,
    sortOrder,
  }: {
    parentId: string | null;
    level: 'BLOCK' | 'CATEGORY' | 'SUBCATEGORY';
    name: string;
    slug: string;
    sortOrder: number;
  }): Promise<string> => {
    const existing = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, slug))
      .limit(1);
    if (existing.length > 0) {
      const [updated] = await db
        .update(schema.categories)
        .set({
          parent_id: parentId,
          level,
          name,
          is_high_risk: false,
          is_active: true,
          is_custom: false,
          sort_order: sortOrder,
        })
        .where(eq(schema.categories.slug, slug))
        .returning();
      return updated!.id;
    }

    const [created] = await db
      .insert(schema.categories)
      .values({
        parent_id: parentId,
        level,
        name,
        slug,
        is_high_risk: false,
        is_active: true,
        is_custom: false,
        sort_order: sortOrder,
      })
      .returning();
    return created!.id;
  };

  const blockIds = new Map<string, string>();
  const categoryIds = new Map<string, string>();

  for (const item of BUSINESS_TAXONOMY_SEED_PLAN) {
    if (!blockIds.has(item.blockSlug)) {
      const blockId = await upsertCategoryNode({
        parentId: null,
        level: 'BLOCK',
        name: item.blockName,
        slug: item.blockSlug,
        sortOrder: blockSortOrder.get(item.blockSlug) ?? 0,
      });
      blockIds.set(item.blockSlug, blockId);
    }

    if (!categoryIds.has(item.categorySlug)) {
      const blockId = blockIds.get(item.blockSlug);
      if (!blockId) throw new Error(`Missing block for category seed: ${item.categorySlug}`);

      const categoryId = await upsertCategoryNode({
        parentId: blockId,
        level: 'CATEGORY',
        name: item.categoryName,
        slug: item.categorySlug,
        sortOrder: categorySortOrder.get(item.categorySlug) ?? 0,
      });
      categoryIds.set(item.categorySlug, categoryId);
    }

    const categoryId = categoryIds.get(item.categorySlug);
    if (!categoryId) throw new Error(`Missing parent category for seed: ${item.subcategorySlug}`);

    await upsertCategoryNode({
      parentId: categoryId,
      level: 'SUBCATEGORY',
      name: item.subcategoryName,
      slug: item.subcategorySlug,
      sortOrder: subcategorySortOrder.get(item.subcategorySlug) ?? 0,
    });
  }

  await db
    .update(schema.categories)
    .set({ is_active: false })
    .where(
      and(
        eq(schema.categories.is_custom, false),
        not(inArray(schema.categories.slug, Array.from(activeTaxonomySlugs))),
      ),
    );

  for (const key of CONFIG_SEED_PLAN.initialAdminConfigKeys) {
    const existing = await db
      .select()
      .from(schema.adminConfigs)
      .where(eq(schema.adminConfigs.key, key))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(schema.adminConfigs).values({
        key,
        value: {},
        description: `Initial ${key} seed placeholder`,
      });
    }
  }

  for (const key of CONFIG_SEED_PLAN.stripePriceKeys) {
    const priceId = resolveStripePriceIdFromEnv(key);
    const valueObj = priceId ? { priceId } : {};

    const existing = await db
      .select()
      .from(schema.adminConfigs)
      .where(eq(schema.adminConfigs.key, key))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(schema.adminConfigs)
        .set({
          value: valueObj,
        })
        .where(eq(schema.adminConfigs.key, key));
    } else {
      await db.insert(schema.adminConfigs).values({
        key,
        value: valueObj,
        description: `Stripe price config for ${key}`,
      });
    }
  }
}

function resolveStripePriceIdFromEnv(configKey: string): string | null {
  const envByKey: Record<string, readonly string[]> = {
    stripe_price_vip_membership_monthly: [
      'STRIPE_PRICE_VIP_MEMBERSHIP_MONTHLY',
      'STRIPE_PRICE_VIP',
    ],
    stripe_price_business_placement_monthly: [
      'STRIPE_PRICE_BUSINESS_PLACEMENT_MONTHLY',
      'STRIPE_PRICE_BUSINESS',
    ],
  };

  for (const envKey of envByKey[configKey] ?? []) {
    const value = process.env[envKey]?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

async function seedBootstrapOwner(db: ReturnType<typeof getDbClient>): Promise<void> {
  const ownerPhone = process.env[ADMIN_BOOTSTRAP_PLAN.ownerPhoneEnv];
  if (!ownerPhone) {
    console.log('Skipping admin owner seed: ADMIN_BOOTSTRAP_OWNER_PHONE is not set');
    return;
  }

  const ownerPassword = process.env[ADMIN_BOOTSTRAP_PLAN.ownerPasswordEnv];
  if (!ownerPassword) {
    console.log(
      'Admin owner seed will not set a password: ADMIN_BOOTSTRAP_OWNER_PASSWORD is not set',
    );
  }

  const phone = normalizePhone(ownerPhone);
  const existing = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.phone, phone))
    .limit(1);
  if (existing.length > 0) {
    const passwordPatch =
      ownerPassword && !existing[0]!.password_hash
        ? {
            password_hash: await hashSeedPassword(ownerPassword),
            password_set_at: new Date(),
          }
        : {};

    await db
      .update(schema.adminUsers)
      .set({
        role: 'OWNER',
        display_name: 'Bootstrap Owner',
        is_active: true,
        ...passwordPatch,
      })
      .where(eq(schema.adminUsers.phone, phone));
  } else {
    await db.insert(schema.adminUsers).values({
      phone,
      role: 'OWNER',
      display_name: 'Bootstrap Owner',
      is_active: true,
      ...(ownerPassword
        ? {
            password_hash: await hashSeedPassword(ownerPassword),
            password_set_at: new Date(),
          }
        : {}),
    });
  }
}

async function seedDemoBusinesses(db: ReturnType<typeof getDbClient>): Promise<void> {
  const countries = await db.select().from(schema.countries);
  const cities = await db.select().from(schema.cities);
  const categories = await db.select().from(schema.categories);

  const countryBySlug = new Map(countries.map((country) => [country.slug, country]));
  const cityByKey = new Map(
    cities.map((city) => {
      const c = countries.find((co) => co.id === city.country_id);
      return [`${c?.slug}:${city.slug}`, city];
    }),
  );
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

  const now = new Date();

  for (const demo of DEMO_BUSINESSES) {
    const country = countryBySlug.get(demo.countrySlug);
    const city = cityByKey.get(`${demo.countrySlug}:${demo.citySlug}`);
    const category = categoryBySlug.get(demo.categorySlug);

    if (!country || !city || !category) {
      throw new Error(`Missing taxonomy for demo business ${demo.slug}`);
    }

    let user;
    const existingUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.phone, demo.userPhone))
      .limit(1);
    if (existingUsers.length > 0) {
      user = (
        await db
          .update(schema.users)
          .set({
            display_name: demo.userDisplayName,
          })
          .where(eq(schema.users.phone, demo.userPhone))
          .returning()
      )[0]!;
    } else {
      user = (
        await db
          .insert(schema.users)
          .values({
            phone: demo.userPhone,
            display_name: demo.userDisplayName,
            locale_preference: 'en',
            terms_accepted_at: now,
          })
          .returning()
      )[0]!;
    }

    const demoDescription = 'description' in demo ? demo.description : undefined;

    const existingBiz = await db
      .select()
      .from(schema.businessProfiles)
      .where(eq(schema.businessProfiles.slug, demo.slug))
      .limit(1);
    if (existingBiz.length > 0) {
      await db
        .update(schema.businessProfiles)
        .set({
          name: demo.name,
          status: 'PUBLISHED',
          brief_description: demo.briefDescription,
          description: demoDescription,
          cover_image_url:
            'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=80',
          logo_url:
            'https://ui-avatars.com/api/?name=' +
            encodeURIComponent(demo.name) +
            '&background=random',
          featured_top: demo.featuredTop,
          featured_recommended: demo.featuredRecommended,
          member_discount_percent: demo.memberDiscountPercent,
          published_at: now,
        })
        .where(eq(schema.businessProfiles.slug, demo.slug));
    } else {
      await db.insert(schema.businessProfiles).values({
        user_id: user.id,
        slug: demo.slug,
        name: demo.name,
        representative_name: demo.representativeName,
        representative_email: demo.representativeEmail,
        representative_phone: demo.representativePhone,
        country_id: country.id,
        city_id: city.id,
        category_id: category.id,
        status: 'PUBLISHED',
        brief_description: demo.briefDescription,
        description: demoDescription,
        cover_image_url:
          'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=80',
        logo_url:
          'https://ui-avatars.com/api/?name=' +
          encodeURIComponent(demo.name) +
          '&background=random',
        featured_top: demo.featuredTop,
        featured_recommended: demo.featuredRecommended,
        member_discount_percent: demo.memberDiscountPercent,
        approved_at: now,
        published_at: now,
      });
    }
  }
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set before running db:seed');
  }

  const db = getDbClient();

  try {
    await seedReferenceData(db);
    console.log(
      `Reference seed complete: ${COUNTRY_SEED_PLAN.length} countries, ${CITY_SEED_PLAN.length} cities, ${CATEGORY_SEED_PLAN.length} categories`,
    );

    await seedBootstrapOwner(db);
    console.log('Admin bootstrap owner seed complete');

    if (isTruthyFlag(process.env.ALLOW_SEED) && isTruthyFlag(process.env.CONFIRM_SEED)) {
      await seedDemoBusinesses(db);
      console.log(`Demo seed complete: ${DEMO_BUSINESSES.length} published businesses`);
    } else {
      console.log(
        'Demo businesses skipped. Set ALLOW_SEED=1 and CONFIRM_SEED=1 to insert demo data.',
      );
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
