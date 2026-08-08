import { type NextRequest } from 'next/server';

import { memberProfileUpdateSchema, parseWithValidation } from '@kclub/validation';
import { ERROR_CODES } from '@kclub/contracts';

import { createSupabaseServerClient } from '@/server/auth';
import { jsonSuccess, jsonError, jsonErrorFromUnknown } from '@/server/api';
import {
  getMemberBySupabaseUserId,
  toCurrentMemberProfileDto,
  updateMemberProfile,
} from '@/server/services';
import { createRequestContext } from '@/server/context';
import { createDbAuditService } from '@/server/audit';

const auditService = createDbAuditService();

export async function GET(_request: NextRequest) {
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

    const user = await getMemberBySupabaseUserId(supabaseUser.id);
    const profile = toCurrentMemberProfileDto(user);

    return jsonSuccess(profile);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}

export async function PATCH(request: NextRequest) {
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
    const parsed = parseWithValidation(memberProfileUpdateSchema, body);

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

    const localUser = await getMemberBySupabaseUserId(supabaseUser.id);
    const context = createRequestContext({
      actor: { kind: 'member', userId: localUser.id },
      headers: request.headers,
    });

    const updated = await updateMemberProfile(localUser, parsed.data);
    const profile = toCurrentMemberProfileDto(updated);

    await auditService.log(
      {
        action: 'USER_PROFILE_UPDATED',
        entityType: 'User',
        entityId: localUser.id,
        after: Object.fromEntries(
          Object.entries(parsed.data).map(([k, v]) => [k, String(v ?? '')]),
        ),
      },
      context,
    );

    return jsonSuccess(profile);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
