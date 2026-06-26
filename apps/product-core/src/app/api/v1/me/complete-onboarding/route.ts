import { type NextRequest } from 'next/server';

import { memberOnboardingSchema, parseWithValidation } from '@kclub/validation';
import { ERROR_CODES } from '@kclub/contracts';

import { createSupabaseServerClient } from '@/server/auth';
import { jsonSuccess, jsonError, jsonErrorFromUnknown } from '@/server/api';
import {
  completeMemberOnboarding,
  toCurrentMemberProfileDto,
  issueCardForUserIfNoneActive,
} from '@/server/services';
import { createRequestContext } from '@/server/context';
import { createDbAuditService } from '@/server/audit';

const auditService = createDbAuditService();

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      return jsonError(
        { code: ERROR_CODES.AUTH_SESSION_REQUIRED, message: 'Authentication required' },
        undefined,
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = parseWithValidation(memberOnboardingSchema, body);

    if (!parsed.success) {
      return jsonError(
        {
          code: parsed.error.code,
          message: parsed.error.message,
          details: { issues: parsed.error.issues },
        },
        undefined,
        { status: 400 },
      );
    }

    const user = await completeMemberOnboarding(supabaseUser.id, parsed.data);

    await issueCardForUserIfNoneActive(user.id, user.membership_tier);

    const context = createRequestContext({ actor: { kind: 'member', userId: user.id }, headers: request.headers });
    await auditService.log(
      { action: 'USER_ONBOARDING_COMPLETED', entityType: 'User', entityId: user.id },
      context,
    );

    const profile = toCurrentMemberProfileDto(user);

    return jsonSuccess(profile, undefined, { status: 200 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
