import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  smallint,
  json,
  char,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// Enums
export const memberTierEnum = pgEnum('member_tier', ['MEMBER', 'VIP']);
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'BLOCKED']);
export const clubCardStatusEnum = pgEnum('club_card_status', ['ACTIVE', 'REVOKED', 'EXPIRED']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'NONE',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'EXPIRED',
]);
export const subscriptionKindEnum = pgEnum('subscription_kind', [
  'VIP_MEMBERSHIP',
  'BUSINESS_PLACEMENT',
]);
export const businessStatusEnum = pgEnum('business_status', [
  'UNDER_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'REJECTED',
  'HIDDEN',
]);
export const introductionStatusEnum = pgEnum('introduction_status', [
  'SUBMITTED',
  'IN_REVIEW',
  'APPROVED',
  'COMPLETED',
  'REJECTED',
  'CANCELED',
]);
export const staffRoleEnum = pgEnum('staff_role', ['OWNER', 'ADMIN', 'MODERATOR', 'SUPPORT']);

// Tables
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    supabase_auth_user_id: uuid('supabase_auth_user_id').unique(),
    phone: varchar('phone', { length: 32 }).notNull().unique(),
    display_name: varchar('display_name', { length: 100 }),
    email: varchar('email', { length: 255 }),
    locale_preference: varchar('locale_preference', { length: 2 }),
    membership_tier: memberTierEnum('membership_tier').default('MEMBER').notNull(),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
    terms_accepted_at: timestamp('terms_accepted_at'),
    country: varchar('country', { length: 100 }),
    city: varchar('city', { length: 100 }),
    about: text('about'),
    avatar_url: varchar('avatar_url', { length: 500 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('users_supabase_auth_user_id_idx').on(table.supabase_auth_user_id),
    index('users_status_created_at_idx').on(table.status, table.created_at),
  ],
);

export const memberCards = pgTable(
  'member_cards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    card_number: varchar('card_number', { length: 16 }).notNull().unique(),
    membership_tier: memberTierEnum('membership_tier').notNull(),
    status: clubCardStatusEnum('status').default('ACTIVE').notNull(),
    qr_payload_url: text('qr_payload_url'),
    issued_at: timestamp('issued_at').defaultNow().notNull(),
    expires_at: timestamp('expires_at'),
    revoked_at: timestamp('revoked_at'),
    revoked_reason: text('revoked_reason'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('member_cards_user_id_issued_at_idx').on(table.user_id, table.issued_at),
    index('member_cards_status_expires_at_idx').on(table.status, table.expires_at),
  ],
);

export const vipSubscriptions = pgTable(
  'vip_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: subscriptionStatusEnum('status').default('NONE').notNull(),
    stripe_customer_id: varchar('stripe_customer_id', { length: 255 }),
    stripe_subscription_id: varchar('stripe_subscription_id', { length: 255 }).unique(),
    stripe_price_id: varchar('stripe_price_id', { length: 255 }),
    current_period_start: timestamp('current_period_start'),
    current_period_end: timestamp('current_period_end'),
    cancel_at_period_end: boolean('cancel_at_period_end').default(false).notNull(),
    canceled_at: timestamp('canceled_at'),
    expires_at: timestamp('expires_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('vip_subs_user_status_end_idx').on(table.user_id, table.status, table.current_period_end),
  ],
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 120 }).notNull().unique(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    is_high_risk: boolean('is_high_risk').default(false).notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    is_custom: boolean('is_custom').default(false).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('categories_risk_active_idx').on(table.is_high_risk, table.is_active)],
);

export const countries = pgTable(
  'countries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code2: char('code2', { length: 2 }).notNull().unique(),
    code3: char('code3', { length: 3 }).unique(),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    is_active: boolean('is_active').default(true).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('countries_active_name_idx').on(table.is_active, table.name)],
);

export const cities = pgTable(
  'cities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    country_id: uuid('country_id')
      .notNull()
      .references(() => countries.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('cities_country_id_slug_idx').on(table.country_id, table.slug),
    index('cities_country_active_name_idx').on(table.country_id, table.is_active, table.name),
  ],
);

export const businessProfiles = pgTable(
  'business_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 140 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    representative_name: varchar('representative_name', { length: 100 }).notNull(),
    representative_email: varchar('representative_email', { length: 255 }).notNull(),
    representative_phone: varchar('representative_phone', { length: 32 }).notNull(),
    country_id: uuid('country_id')
      .notNull()
      .references(() => countries.id, { onDelete: 'restrict' }),
    city_id: uuid('city_id')
      .notNull()
      .references(() => cities.id, { onDelete: 'restrict' }),
    category_id: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    status: businessStatusEnum('status').default('UNDER_REVIEW').notNull(),
    website_url: text('website_url'),
    social_url: text('social_url'),
    cover_image_url: text('cover_image_url'),
    logo_url: text('logo_url'),
    brief_description: varchar('brief_description', { length: 2000 }),
    description: text('description'),
    featured_top: boolean('featured_top').default(false).notNull(),
    featured_recommended: boolean('featured_recommended').default(false).notNull(),
    member_discount_percent: smallint('member_discount_percent'),
    discount_muted: boolean('discount_muted').default(false).notNull(),
    internal_notes: text('internal_notes'),
    rejection_reason: text('rejection_reason'),
    approved_at: timestamp('approved_at'),
    published_at: timestamp('published_at'),
    hidden_at: timestamp('hidden_at'),
    rejected_at: timestamp('rejected_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('bp_status_created_idx').on(table.status, table.created_at),
    index('bp_status_featured_cat_idx').on(
      table.status,
      table.featured_top,
      table.featured_recommended,
      table.category_id,
    ),
    index('bp_status_loc_cat_pub_idx').on(
      table.status,
      table.country_id,
      table.city_id,
      table.category_id,
      table.published_at,
    ),
  ],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    business_profile_id: uuid('business_profile_id').references(() => businessProfiles.id, {
      onDelete: 'set null',
    }),
    kind: subscriptionKindEnum('kind').notNull(),
    status: subscriptionStatusEnum('status').default('NONE').notNull(),
    stripe_customer_id: varchar('stripe_customer_id', { length: 255 }),
    stripe_subscription_id: varchar('stripe_subscription_id', { length: 255 }).unique(),
    stripe_price_id: varchar('stripe_price_id', { length: 255 }),
    current_period_start: timestamp('current_period_start'),
    current_period_end: timestamp('current_period_end'),
    cancel_at_period_end: boolean('cancel_at_period_end').default(false).notNull(),
    canceled_at: timestamp('canceled_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('subs_user_kind_status_end_idx').on(
      table.user_id,
      table.kind,
      table.status,
      table.current_period_end,
    ),
    index('subs_bp_kind_status_end_idx').on(
      table.business_profile_id,
      table.kind,
      table.status,
      table.current_period_end,
    ),
  ],
);

export const businessIntroductions = pgTable(
  'business_introductions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    requester_user_id: uuid('requester_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    requester_business_id: uuid('requester_business_id').references(() => businessProfiles.id, {
      onDelete: 'cascade',
    }),
    target_business_id: uuid('target_business_id')
      .notNull()
      .references(() => businessProfiles.id, { onDelete: 'cascade' }),
    status: introductionStatusEnum('status').default('SUBMITTED').notNull(),
    client_name: varchar('client_name', { length: 200 }).default('').notNull(),
    client_contact: varchar('client_contact', { length: 255 }).default('').notNull(),
    message: text('message'),
    rejection_reason: text('rejection_reason'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('intro_req_status_created_idx').on(
      table.requester_user_id,
      table.status,
      table.created_at,
    ),
    index('intro_target_status_created_idx').on(
      table.target_business_id,
      table.status,
      table.created_at,
    ),
  ],
);

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    phone: varchar('phone', { length: 32 }).notNull().unique(),
    role: staffRoleEnum('role').notNull(),
    display_name: varchar('display_name', { length: 100 }),
    is_active: boolean('is_active').default(true).notNull(),
    password_hash: text('password_hash'),
    password_set_at: timestamp('password_set_at'),
    permission_overrides: json('permission_overrides').$type<{
      granted: string[];
      denied: string[];
    } | null>(),
    totp_verified_at: timestamp('totp_verified_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('admin_role_active_created_idx').on(table.role, table.is_active, table.created_at),
  ],
);

export const admin2fa = pgTable('admin_2fa', {
  id: uuid('id').defaultRandom().primaryKey(),
  admin_user_id: uuid('admin_user_id')
    .notNull()
    .unique()
    .references(() => adminUsers.id, { onDelete: 'cascade' }),
  secret_ciphertext: text('secret_ciphertext').notNull(),
  backup_codes_hashes: json('backup_codes_hashes'),
  verified_at: timestamp('verified_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    admin_user_id: uuid('admin_user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    session_token_hash: text('session_token_hash').notNull().unique(),
    ip_address: varchar('ip_address', { length: 64 }),
    user_agent: text('user_agent'),
    expires_at: timestamp('expires_at').notNull(),
    last_seen_at: timestamp('last_seen_at'),
    revoked_at: timestamp('revoked_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('admin_sess_user_expires_idx').on(table.admin_user_id, table.expires_at),
    index('admin_sess_expires_revoked_idx').on(table.expires_at, table.revoked_at),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actor_staff_id: uuid('actor_staff_id').references(() => adminUsers.id, {
      onDelete: 'set null',
    }),
    actor_role: staffRoleEnum('actor_role'),
    action: varchar('action', { length: 120 }).notNull(),
    entity_type: varchar('entity_type', { length: 120 }).notNull(),
    entity_id: text('entity_id').notNull(),
    before_data: json('before_data'),
    after_data: json('after_data'),
    metadata: json('metadata'),
    ip_address: varchar('ip_address', { length: 64 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('audit_actor_created_idx').on(table.actor_staff_id, table.created_at),
    index('audit_entity_created_idx').on(table.entity_type, table.entity_id, table.created_at),
    index('audit_action_created_idx').on(table.action, table.created_at),
  ],
);

export const adminConfigs = pgTable(
  'admin_config',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: varchar('key', { length: 120 }).notNull().unique(),
    value: json('value').notNull(),
    description: text('description'),
    updated_by_staff_id: uuid('updated_by_staff_id').references(() => adminUsers.id, {
      onDelete: 'set null',
    }),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('admin_config_key_idx').on(table.key)],
);

export const stripeWebhookEvents = pgTable(
  'stripe_webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    event_id: varchar('event_id', { length: 255 }).notNull().unique(),
    event_type: varchar('event_type', { length: 120 }).notNull(),
    handler_status: varchar('handler_status', { length: 32 }).default('RECEIVED').notNull(),
    livemode: boolean('livemode').default(false).notNull(),
    payload: json('payload').notNull(),
    error_message: text('error_message'),
    processed_at: timestamp('processed_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('stripe_evt_status_created_idx').on(table.handler_status, table.created_at),
    index('stripe_evt_type_created_idx').on(table.event_type, table.created_at),
  ],
);
