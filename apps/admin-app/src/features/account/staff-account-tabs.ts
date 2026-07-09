export const STAFF_ACCOUNT_TABS = [
  'details',
  'security',
  'activity',
  'permissions',
  'settings',
] as const;

export type StaffAccountTab = (typeof STAFF_ACCOUNT_TABS)[number];

const DEFAULT_TAB: StaffAccountTab = 'details';

export const STAFF_ACCOUNT_TAB_LABELS: Record<StaffAccountTab, string> = {
  details: 'Profile',
  security: 'Security',
  activity: 'Activity',
  permissions: 'Permissions',
  settings: 'Settings',
};

export function normalizeAccountTab(tab: string | undefined): StaffAccountTab {
  if (tab && (STAFF_ACCOUNT_TABS as readonly string[]).includes(tab)) {
    return tab as StaffAccountTab;
  }
  return DEFAULT_TAB;
}
