import { test as base, expect } from './base';
import type { Page } from '@playwright/test';

import { signInMember } from '../helpers/auth';
import type { SeedResult } from '../helpers/seed';

export type AuthFixtures = {
  /** Authenticated member page — signs in automatically */
  authenticatedPage: Page;
  /** Seed result for the authenticated member */
  memberData: SeedResult;
};

/**
 * Extended test with a pre-authenticated member session.
 * Uses the seed API to create a member, then signs in via the UI.
 */
export const test = base.extend<AuthFixtures>({
  memberData: async ({ seed }, use) => {
    const data = await seed('member-with-card');
    await use(data);
  },

  authenticatedPage: async ({ page, locale, memberData }, use) => {
    if (memberData.phone) {
      await signInMember(page, locale, memberData.phone);
    }

    await use(page);
  },
});

export { expect };
