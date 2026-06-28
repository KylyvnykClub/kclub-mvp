import { describe, expect, test } from 'bun:test';

import { schema } from '../src';

describe('database package schema', () => {
  test('drizzle schema exports all MVP tables', () => {
    const tableKeys = Object.keys(schema);
    
    for (const tableName of [
      'users',
      'memberCards',
      'vipSubscriptions',
      'subscriptions',
      'businessProfiles',
      'businessIntroductions',
      'categories',
      'countries',
      'cities',
      'adminUsers',
      'admin2Fa',
      'adminSessions',
      'auditLogs',
      'adminConfig',
      'stripeWebhookEvents',
    ]) {
      expect(tableKeys).toContain(tableName);
    }
  });
});
