import { PrismaClient } from '../generated/client/index.js';
import {
  ADMIN_BOOTSTRAP_PLAN,
  CATEGORY_SEED_PLAN,
  CITY_SEED_PLAN,
  CONFIG_SEED_PLAN,
  COUNTRY_SEED_PLAN,
} from './seed-plan.js';

const DEMO_BUSINESSES = [
  {
    userPhone: '+15551000001',
    userDisplayName: 'Skyline Partner',
    slug: 'skyline-hospitality-group',
    name: 'Skyline Hospitality Group',
    representativeName: 'Alex Morgan',
    representativeEmail: 'alex@skyline-hospitality.example',
    representativePhone: '+15551000001',
    categorySlug: 'hospitality',
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
    categorySlug: 'wellness',
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
    categorySlug: 'legal-services',
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
    categorySlug: 'lifestyle-concierge',
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
    categorySlug: 'investment-wealth',
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
    categorySlug: 'yachting-charter',
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

function isTruthyFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '').trim();
}

async function seedReferenceData(prisma: PrismaClient): Promise<void> {
  for (const country of COUNTRY_SEED_PLAN) {
    await prisma.country.upsert({
      where: { slug: country.slug },
      create: {
        code2: country.code2,
        code3: country.code3,
        name: country.name,
        slug: country.slug,
        is_active: true,
      },
      update: {
        code2: country.code2,
        code3: country.code3,
        name: country.name,
        is_active: true,
      },
    });
  }

  const countries = await prisma.country.findMany({
    where: { slug: { in: COUNTRY_SEED_PLAN.map((country) => country.slug) } },
  });
  const countryBySlug = new Map(countries.map((country) => [country.slug, country]));

  for (const city of CITY_SEED_PLAN) {
    const country = countryBySlug.get(city.countrySlug);
    if (!country) {
      throw new Error(`Missing country for city seed: ${city.countrySlug}`);
    }

    await prisma.city.upsert({
      where: {
        country_id_slug: {
          country_id: country.id,
          slug: city.slug,
        },
      },
      create: {
        country_id: country.id,
        name: city.name,
        slug: city.slug,
        is_active: true,
      },
      update: {
        name: city.name,
        is_active: true,
      },
    });
  }

  for (const category of CATEGORY_SEED_PLAN) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        is_high_risk: category.isHighRisk,
        is_active: true,
      },
      update: {
        name: category.name,
        is_high_risk: category.isHighRisk,
        is_active: true,
      },
    });
  }

  for (const key of CONFIG_SEED_PLAN.initialAdminConfigKeys) {
    await prisma.adminConfig.upsert({
      where: { key },
      create: {
        key,
        value: {},
        description: `Initial ${key} seed placeholder`,
      },
      update: {},
    });
  }

  for (const key of CONFIG_SEED_PLAN.stripePriceKeys) {
    const priceId = resolveStripePriceIdFromEnv(key);

    await prisma.adminConfig.upsert({
      where: { key },
      create: {
        key,
        value: priceId ? { priceId } : {},
        description: `Stripe price config for ${key}`,
      },
      update: priceId ? { value: { priceId } } : {},
    });
  }
}

function resolveStripePriceIdFromEnv(configKey: string): string | null {
  const envByKey: Record<string, readonly string[]> = {
    stripe_price_vip_membership_monthly: [
      'STRIPE_PRICE_VIP_MEMBERSHIP_MONTHLY',
      'STRIPE_PRICE_VIP_ANNUAL',
    ],
    stripe_price_business_placement_monthly: [
      'STRIPE_PRICE_BUSINESS_PLACEMENT_MONTHLY',
      'STRIPE_PRICE_BUSINESS_ANNUAL',
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

async function seedBootstrapOwner(prisma: PrismaClient): Promise<void> {
  const ownerPhone = process.env[ADMIN_BOOTSTRAP_PLAN.ownerPhoneEnv];
  if (!ownerPhone) {
    console.log('Skipping admin owner seed: ADMIN_BOOTSTRAP_OWNER_PHONE is not set');
    return;
  }

  const phone = normalizePhone(ownerPhone);
  await prisma.adminUser.upsert({
    where: { phone },
    create: {
      phone,
      role: 'OWNER',
      display_name: 'Bootstrap Owner',
      is_active: true,
    },
    update: {
      role: 'OWNER',
      display_name: 'Bootstrap Owner',
      is_active: true,
    },
  });
}

async function seedDemoBusinesses(prisma: PrismaClient): Promise<void> {
  const countries = await prisma.country.findMany();
  const cities = await prisma.city.findMany({ include: { country: true } });
  const categories = await prisma.category.findMany();

  const countryBySlug = new Map(countries.map((country) => [country.slug, country]));
  const cityByKey = new Map(cities.map((city) => [`${city.country.slug}:${city.slug}`, city]));
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

  const now = new Date();

  for (const demo of DEMO_BUSINESSES) {
    const country = countryBySlug.get(demo.countrySlug);
    const city = cityByKey.get(`${demo.countrySlug}:${demo.citySlug}`);
    const category = categoryBySlug.get(demo.categorySlug);

    if (!country || !city || !category) {
      throw new Error(`Missing taxonomy for demo business ${demo.slug}`);
    }

    const user = await prisma.user.upsert({
      where: { phone: demo.userPhone },
      create: {
        phone: demo.userPhone,
        display_name: demo.userDisplayName,
        locale_preference: 'en',
        terms_accepted_at: now,
      },
      update: {
        display_name: demo.userDisplayName,
      },
    });

    const demoDescription = 'description' in demo ? demo.description : undefined;

    await prisma.businessProfile.upsert({
      where: { slug: demo.slug },
      create: {
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
        featured_top: demo.featuredTop,
        featured_recommended: demo.featuredRecommended,
        member_discount_percent: demo.memberDiscountPercent,
        approved_at: now,
        published_at: now,
      },
      update: {
        name: demo.name,
        status: 'PUBLISHED',
        brief_description: demo.briefDescription,
        description: demoDescription,
        featured_top: demo.featuredTop,
        featured_recommended: demo.featuredRecommended,
        member_discount_percent: demo.memberDiscountPercent,
        published_at: now,
      },
    });
  }
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set before running db:seed');
  }

  const prisma = new PrismaClient();

  try {
    await seedReferenceData(prisma);
    console.log(
      `Reference seed complete: ${COUNTRY_SEED_PLAN.length} countries, ${CITY_SEED_PLAN.length} cities, ${CATEGORY_SEED_PLAN.length} categories`,
    );

    await seedBootstrapOwner(prisma);
    console.log('Admin bootstrap owner seed complete');

    if (isTruthyFlag(process.env.ALLOW_SEED) && isTruthyFlag(process.env.CONFIRM_SEED)) {
      await seedDemoBusinesses(prisma);
      console.log(`Demo seed complete: ${DEMO_BUSINESSES.length} published businesses`);
    } else {
      console.log(
        'Demo businesses skipped. Set ALLOW_SEED=1 and CONFIRM_SEED=1 to insert demo data.',
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
