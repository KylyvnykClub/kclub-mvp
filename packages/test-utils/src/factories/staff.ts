import type { StaffPasswordStatus, StaffRole } from '@kclub/contracts';

import {
  makeEntityId,
  makeIsoDate,
  makePhone,
  nextSequence,
  type FactoryOverrides,
  withOverrides,
} from './shared';

export type TestStaffUser = {
  id: string;
  phone: string;
  role: StaffRole;
  displayName: string | null;
  isActive: boolean;
  passwordStatus: StaffPasswordStatus;
  createdAt: string;
  updatedAt: string;
};

export function createStaffUser(overrides?: FactoryOverrides<TestStaffUser>): TestStaffUser {
  const sequence = nextSequence('staff-user');
  const createdAt = makeIsoDate(sequence, 2);

  return withOverrides(
    {
      id: makeEntityId('staff', sequence),
      phone: makePhone(sequence + 5000),
      role: 'MODERATOR',
      displayName: `Staff ${sequence}`,
      isActive: true,
      passwordStatus: 'SET',
      createdAt,
      updatedAt: createdAt,
    },
    overrides,
  );
}
