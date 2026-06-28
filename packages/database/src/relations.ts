import { relations } from 'drizzle-orm';
import { users, memberCards, vipSubscriptions, businessProfiles, subscriptions, businessIntroductions, categories, countries, cities, adminUsers, admin2fa, adminSessions, auditLogs, adminConfigs } from './schema.js';

export const usersRelations = relations(users, ({ many }) => ({
  memberCards: many(memberCards),
  vipSubscriptions: many(vipSubscriptions),
  businessProfiles: many(businessProfiles),
  subscriptions: many(subscriptions),
  businessIntroductionsAsRequester: many(businessIntroductions, { relationName: 'requester' }),
}));

export const countriesRelations = relations(countries, ({ many }) => ({
  cities: many(cities),
  businessProfiles: many(businessProfiles),
}));

export const citiesRelations = relations(cities, ({ one, many }) => ({
  country: one(countries, {
    fields: [cities.country_id],
    references: [countries.id],
  }),
  businessProfiles: many(businessProfiles),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  businessProfiles: many(businessProfiles),
}));

export const businessProfilesRelations = relations(businessProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [businessProfiles.user_id],
    references: [users.id],
  }),
  country: one(countries, {
    fields: [businessProfiles.country_id],
    references: [countries.id],
  }),
  city: one(cities, {
    fields: [businessProfiles.city_id],
    references: [cities.id],
  }),
  category: one(categories, {
    fields: [businessProfiles.category_id],
    references: [categories.id],
  }),
  subscriptions: many(subscriptions),
  introductionsAsRequester: many(businessIntroductions, { relationName: 'requesterBusiness' }),
  introductionsAsTarget: many(businessIntroductions, { relationName: 'targetBusiness' }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.user_id],
    references: [users.id],
  }),
  businessProfile: one(businessProfiles, {
    fields: [subscriptions.business_profile_id],
    references: [businessProfiles.id],
  }),
}));

export const businessIntroductionsRelations = relations(businessIntroductions, ({ one }) => ({
  requesterUser: one(users, {
    fields: [businessIntroductions.requester_user_id],
    references: [users.id],
    relationName: 'requester',
  }),
  requesterBusiness: one(businessProfiles, {
    fields: [businessIntroductions.requester_business_id],
    references: [businessProfiles.id],
    relationName: 'requesterBusiness',
  }),
  targetBusiness: one(businessProfiles, {
    fields: [businessIntroductions.target_business_id],
    references: [businessProfiles.id],
    relationName: 'targetBusiness',
  }),
}));

export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  twoFactorAuth: one(admin2fa, {
    fields: [adminUsers.id],
    references: [admin2fa.admin_user_id],
  }),
  sessions: many(adminSessions),
  auditLogs: many(auditLogs),
  adminConfigsUpdated: many(adminConfigs),
}));
