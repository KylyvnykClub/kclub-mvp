import type { IntroductionDto, IntroductionStatus } from '@kclub/contracts';

import {
  makeEntityId,
  makeIsoDate,
  nextSequence,
  type FactoryOverrides,
  withOverrides,
} from './shared';

export type TestIntroduction = IntroductionDto;

export function createIntroduction(
  overrides?: FactoryOverrides<TestIntroduction>,
): TestIntroduction {
  const sequence = nextSequence('introduction');
  const createdAt = makeIsoDate(sequence, 11);
  const status: IntroductionStatus = overrides?.status ?? 'SUBMITTED';

  return withOverrides(
    {
      id: makeEntityId('introduction', sequence),
      requesterUserId: makeEntityId('member', sequence),
      requesterBusinessId: makeEntityId('business', sequence),
      targetBusinessId: makeEntityId('business', sequence + 1000),
      clientName: `Client ${sequence}`,
      clientContact: `client${sequence}@example.com`,
      status,
      message: `Introduction request ${sequence}`,
      rejectionReason: status === 'REJECTED' ? 'Target is unavailable.' : null,
      createdAt,
      updatedAt: createdAt,
    },
    overrides,
  );
}
