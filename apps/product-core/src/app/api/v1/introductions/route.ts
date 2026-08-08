import { type NextRequest } from 'next/server';

import { ERROR_CODES } from '@kclub/contracts';
import { introductionSubmitSchema } from '@kclub/validation';

import { createSupabaseServerClient } from '@/server/auth';
import { jsonSuccess, jsonError, jsonErrorFromUnknown } from '@/server/api';
import { getMemberBySupabaseUserId, assertMemberOnboardingComplete } from '@/server/services';
import { submitIntroduction, getOwnIntroductions } from '@/server/services/introduction-service';
import { createRequestContext } from '@/server/context';

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
    const introductions = await getOwnIntroductions(localUser.id);
    return jsonSuccess(introductions);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}

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

    const localUser = await getMemberBySupabaseUserId(supabaseUser.id);
    assertMemberOnboardingComplete(localUser);
    const context = createRequestContext({
      actor: { kind: 'member', userId: localUser.id },
      headers: request.headers,
    });

    const body = await request.json();
    const input = introductionSubmitSchema.parse(body);

    const introduction = await submitIntroduction(input, context);
    return jsonSuccess(introduction, undefined, { status: 201 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
