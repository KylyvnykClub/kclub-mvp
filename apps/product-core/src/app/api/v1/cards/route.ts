import { type NextRequest } from 'next/server';

import { ERROR_CODES } from '@kclub/contracts';

import { createSupabaseServerClient } from '@/server/auth';
import { jsonSuccess, jsonError, jsonErrorFromUnknown } from '@/server/api';
import {
  getActiveCardForUser,
  toMemberCardDto,
  getMemberBySupabaseUserId,
} from '@/server/services';

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

    const localUser = await getMemberBySupabaseUserId(supabaseUser.id);
    const card = await getActiveCardForUser(localUser.id);

    return jsonSuccess(card ? toMemberCardDto(card) : null);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
