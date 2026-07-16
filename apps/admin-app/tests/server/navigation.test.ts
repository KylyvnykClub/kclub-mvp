import { describe, expect, test } from 'bun:test';

import { dashboardNav } from '../../src/components/dashboard/navigation';

describe('dashboard navigation', () => {
  test('shows Staff only to owners', () => {
    const ownerItems = dashboardNav.filter((item) => item.roles.includes('OWNER'));
    const adminItems = dashboardNav.filter((item) => item.roles.includes('ADMIN'));
    const moderatorItems = dashboardNav.filter((item) => item.roles.includes('MODERATOR'));

    expect(ownerItems.some((item) => item.href === '/dashboard/staff')).toBe(true);
    expect(adminItems.some((item) => item.href === '/dashboard/staff')).toBe(false);
    expect(moderatorItems.some((item) => item.href === '/dashboard/staff')).toBe(false);
  });
});
