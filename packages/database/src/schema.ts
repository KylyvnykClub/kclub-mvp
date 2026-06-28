import { 
  pgEnum, 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  smallint, 
  json, 
  char,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const memberTierEnum = pgEnum('member_tier', ['MEMBER', 'VIP']);
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'BLOCKED']);
export const clubCardStatusEnum = pgEnum('club_card_status', ['ACTIVE', 'REVOKED', 'EXPIRED']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['NONE', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED']);
export const subscriptionKindEnum = pgEnum('subscription_kind', ['VIP_MEMBERSHIP', 'BUSINESS_PLACEMENT']);
export const businessStatusEnum = pgEnum('business_status', ['UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'HIDDEN']);
export const introductionStatusEnum = pgEnum('introduction_status', ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELED']);
export const staffRoleEnum = pgEnum('staff_role', ['OWNER', 'ADMIN', 'MODERATOR', 'SUPPORT']);

// Tables
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  supabaseAuthUserId: uuid('supabase_auth_user_id').unique(),
  phone: varchar('phone', { length: 32 }).unique().notNull(),
  displayName: varchar('display_name', { length: 100 }),
  localePreference: varchar('locale_preference', { length: 2 }),
  membershipTier: memberTierEnum('membership_tier').default('MEMBER').notNull(),
  status: userStatusEnum('status').default('ACTIVE').notNull(),
  termsAcceptedAt: timestamp('terms_accepted_at', { mode: 'date' }),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  about: text('about'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => ({
  statusCreatedAtIndex: index('users_status_created_at_idx').on(t.status, t.createdAt),
}));

export const memberCards = pgTable('member_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardNumber: varchar('card_number', { length: 16 }).unique().notNull(),
  membershipTier: memberTierEnum('membership_tier').notNull(),
  status: clubCardStatusEnum('status').default('ACTIVE').notNull(),
  qrPayloadUrl: text('qr_payload_url'),
  issuedAt: timestamp('issued_at', { mode: 'date' }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  revokedAt: timestamp('revoked_at', { mode: 'date' }),
  revokedReason: text('revoked_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => ({
  userIdIssuedAtIndex: index('member_cards_user_id_issued_at_idx').on(t.userId, t.issuedAt),
  statusExpiresAtIndex: index('member_cards_status_expires_at_idx').on(t.status, t.expiresAt),
}));

export const vipSubscriptions = pgTable('vip_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: subscriptionStatusEnum('status').default('NONE').notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).unique(),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  currentPeriodStart: timestamp('current_period_start', { mode: 'date' }),
  currentPeriodEnd: timestamp('current_period_end', { mode: 'date' }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  canceledAt: timestamp('canceled_at', { mode: 'date' }),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => ({
  userStatusPeriodEndIndex: index('vip_subscriptions_user_status_period_end_idx').on(t.userId, t.status, t.currentPeriodEnd),
}));

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).unique().notNull(),
  slug: varchar('slug', { length: 120 }).unique().notNull(),
  isHighRisk: boolean('is_high_risk').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => ({
  highRiskActiveIndex: index('categories_high_risk_active_idx').on(t.isHighRisk, t.isActive),
}));

export const countries = pgTable('countries', {
  id: uuid('id').defaultRandom().primaryKey(),
  code2: char('code2', { length: 2 }).unique().notNull(),
  code3: char('code3', { length: 3 }).unique(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 120 }).unique().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => ({
  activeNameIndex: index('countries_active_name_idx').on(t.isActive, t.name),
}));

export const cities = pgTable('cities', {
  id: uuid('id').defaultRandom().primaryKey(),
  countryId: uuid('country_id').notNull().references(() => countries.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => ({
  countrySlugUnique: unique('cities_country_id_slug_key').on(t.countryId, t.slug),
  countryActiveNameIndex: index('cities_country_active_name_idx').on(t.countryId, t.isActive, t.name),
}));

export const businessProfiles = pgTable('business_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 140 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  representativeName: varchar('representative_name', { length: 100 }).notNull(),
  representativeEmail: varchar('representative_email', { length: 255 }).notNull(),
  representativePhone: varchar('representative_phone', { length: 32 }).notNull(),
  countryId: uuid('country_id').notNull().references(() => countries.id, { onDelete: 'restrict' }),
  cityId: uuid('city_id').notNull().references(() => cities.id, { onDelete: 'restrict' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  status: businessStatusEnum('status').default('UNDER_REVIEW').notNull(),
  websiteUrl: text('website_url'),
  socialUrl: text('social_url'),
  briefDescription: varchar('brief_description', { length: 500 }),
  description: text('description'),
  featuredTop: boolean('featured_top').default(false).notNull(),
  featuredRecommended: boolean('featured_recommended').default(false).notNull(),
  memberDiscountPercent: smallint('member_discount_percent'),
  internalNotes: text('internal_notes'),
  rejectionReason: text('rejection_reason'),
  approvedAt: timestamp('approved_at', { mode: 'date' }),
  publishedAt: timestamp('published_at', { mode: 'date' }),
  hiddenAt: timestamp('hidden_at', { mode: 'date' }),
  rejectedAt: timestamp('rejected_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => ({
  statusCreatedAtIndex: index('business_profiles_status_created_at_idx').on(t.status, t.createdAt),
  statusFeaturedCategoryIndex: index('business_profiles_status_feat_cat_idx').on(t.status, t.featuredTop, t.featuredRecommended, t.categoryId),
  statusGeoCategoryPubIndex: index('business_profiles_status_geo_cat_pub_idx').on(t.status, t.countryId, t.cityId, t.categoryId, t.publishedAt),
}));

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  businessProfileId: uuid('business_profile_id').references(() => businessProfiles.id, { onDelete: 'set null' }),
  kind: subscriptionKindEnum('kind').notNull(),
  status: subscriptionStatusEnum('status').default('NONE').notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).unique(),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  currentPeriodStart: timestamp('current_period_start', { mode: 'date' }),
  currentPeriodEnd: timestamp('current_period_end', { mode: 'date' }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  canceledAt: timestamp('canceled_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => ({
  userKindStatusPeriodIndex: index('subscriptions_user_kind_status_period_idx').on(t.userId, t.kind, t.status, t.currentPeriodEnd),
  businessKindStatusPeriodIndex: index('subscriptions_business_kind_status_period_idx').on(t.businessProfileId, t.kind, t.status, t.currentPeriodEnd),
}));

export const businessIntroductions = pgTable('business_introductions', {
  id: uuid('id').defaultRandom().primaryKey(),
  requesterUserId: uuid('requester_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  requesterBusinessId: uuid('requester_business_id').references(() => businessProfiles.id, { onDelete: 'cascade' }),
  targetBusinessId: uuid('target_business_id').notNull().references(() => businessProfiles.id, { onDelete: 'cascade' }),
  status: introductionStatusEnum('status').default('SUBMITTED').notNull(),
  clientName: varchar('client_name', { length: 200 }).default('').notNull(),
  clientContact: varchar('client_contact', { length: 255 }).default('').notNull(),
  message: text('message'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => ({
  requesterStatusCreatedIndex: index('business_introductions_req_status_created_idx').on(t.requesterUserId, t.status, t.createdAt),
  targetStatusCreatedIndex: index('business_introductions_target_status_created_idx').on(t.targetBusinessId, t.status, t.createdAt),
}));

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 32 }).unique().notNull(),
  role: staffRoleEnum('role').notNull(),
  displayName: varchar('display_name', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  totpVerifiedAt: timestamp('totp_verified_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => ({
  roleActiveCreatedIndex: index('admin_users_role_active_created_idx').on(t.role, t.isActive, t.createdAt),
}));

export const admin2Fa = pgTable('admin_2fa', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminUserId: uuid('admin_user_id').unique().notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  secretCiphertext: text('secret_ciphertext').notNull(),
  backupCodesHashes: json('backup_codes_hashes'),
  verifiedAt: timestamp('verified_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export const adminSessions = pgTable('admin_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminUserId: uuid('admin_user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  sessionTokenHash: text('session_token_hash').unique().notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { mode: 'date' }),
  revokedAt: timestamp('revoked_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (t) => ({
  adminUserExpiresIndex: index('admin_sessions_admin_expires_idx').on(t.adminUserId, t.expiresAt),
  expiresRevokedIndex: index('admin_sessions_expires_revoked_idx').on(t.expiresAt, t.revokedAt),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorStaffId: uuid('actor_staff_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  actorRole: staffRoleEnum('actor_role'),
  action: varchar('action', { length: 120 }).notNull(),
  entityType: varchar('entity_type', { length: 120 }).notNull(),
  entityId: text('entity_id').notNull(),
  beforeData: json('before_data'),
  afterData: json('after_data'),
  metadata: json('metadata'),
  ipAddress: varchar('ip_address', { length: 64 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (t) => ({
  actorCreatedIndex: index('audit_logs_actor_created_idx').on(t.actorStaffId, t.createdAt),
  entityCreatedIndex: index('audit_logs_entity_created_idx').on(t.entityType, t.entityId, t.createdAt),
  actionCreatedIndex: index('audit_logs_action_created_idx').on(t.action, t.createdAt),
}));

export const adminConfig = pgTable('admin_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 120 }).unique().notNull(),
  value: json('value').notNull(),
  description: text('description'),
  updatedByStaffId: uuid('updated_by_staff_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => ({
  keyIndex: index('admin_config_key_idx').on(t.key),
}));

export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: varchar('event_id', { length: 255 }).unique().notNull(),
  eventType: varchar('event_type', { length: 120 }).notNull(),
  handlerStatus: varchar('handler_status', { length: 32 }).default('RECEIVED').notNull(),
  livemode: boolean('livemode').default(false).notNull(),
  payload: json('payload').notNull(),
  errorMessage: text('error_message'),
  processedAt: timestamp('processed_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => ({
  handlerStatusCreatedIndex: index('stripe_webhook_events_status_created_idx').on(t.handlerStatus, t.createdAt),
  eventTypeCreatedIndex: index('stripe_webhook_events_type_created_idx').on(t.eventType, t.createdAt),
}));

// Relations definition
export const usersRelations = relations(users, ({ many }) => ({
  memberCards: many(memberCards),
  vipSubscriptions: many(vipSubscriptions),
  subscriptions: many(subscriptions),
  businessProfiles: many(businessProfiles),
  requestedIntros: many(businessIntroductions, { relationName: 'requester_user' }),
}));

export const memberCardsRelations = relations(memberCards, ({ one }) => ({
  user: one(users, { fields: [memberCards.userId], references: [users.id] }),
}));

export const vipSubscriptionsRelations = relations(vipSubscriptions, ({ one }) => ({
  user: one(users, { fields: [vipSubscriptions.userId], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  businessProfile: one(businessProfiles, { fields: [subscriptions.businessProfileId], references: [businessProfiles.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  businessProfiles: many(businessProfiles),
}));

export const countriesRelations = relations(countries, ({ many }) => ({
  cities: many(cities),
  businesses: many(businessProfiles),
}));

export const citiesRelations = relations(cities, ({ one, many }) => ({
  country: one(countries, { fields: [cities.countryId], references: [countries.id] }),
  businesses: many(businessProfiles),
}));

export const businessProfilesRelations = relations(businessProfiles, ({ one, many }) => ({
  user: one(users, { fields: [businessProfiles.userId], references: [users.id] }),
  country: one(countries, { fields: [businessProfiles.countryId], references: [countries.id] }),
  city: one(cities, { fields: [businessProfiles.cityId], references: [cities.id] }),
  category: one(categories, { fields: [businessProfiles.categoryId], references: [categories.id] }),
  subscriptions: many(subscriptions),
  outgoingIntroductions: many(businessIntroductions, { relationName: 'requester_business' }),
  incomingIntroductions: many(businessIntroductions, { relationName: 'target_business' }),
}));

export const businessIntroductionsRelations = relations(businessIntroductions, ({ one }) => ({
  requesterUser: one(users, { fields: [businessIntroductions.requesterUserId], references: [users.id], relationName: 'requester_user' }),
  requesterBusiness: one(businessProfiles, { fields: [businessIntroductions.requesterBusinessId], references: [businessProfiles.id], relationName: 'requester_business' }),
  targetBusiness: one(businessProfiles, { fields: [businessIntroductions.targetBusinessId], references: [businessProfiles.id], relationName: 'target_business' }),
}));

export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  twoFactor: one(admin2Fa, { fields: [adminUsers.id], references: [admin2Fa.adminUserId] }),
  sessions: many(adminSessions),
  auditLogs: many(auditLogs),
  updatedConfigs: many(adminConfig, { relationName: 'admin_config_updated_by' }),
}));

export const admin2FaRelations = relations(admin2Fa, ({ one }) => ({
  adminUser: one(adminUsers, { fields: [admin2Fa.adminUserId], references: [adminUsers.id] }),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  adminUser: one(adminUsers, { fields: [adminSessions.adminUserId], references: [adminUsers.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actorStaff: one(adminUsers, { fields: [auditLogs.actorStaffId], references: [adminUsers.id] }),
}));

export const adminConfigRelations = relations(adminConfig, ({ one }) => ({
  updatedByStaff: one(adminUsers, { fields: [adminConfig.updatedByStaffId], references: [adminUsers.id], relationName: 'admin_config_updated_by' }),
}));
