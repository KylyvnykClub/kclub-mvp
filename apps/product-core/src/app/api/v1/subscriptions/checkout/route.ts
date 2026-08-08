import { type NextRequest } from 'next/server';

import { ERROR_CODES } from '@kclub/contracts';

import { createSupabaseServerClient } from '@/server/auth';
import { jsonSuccess, jsonError, jsonErrorFromUnknown } from '@/server/api';
import { isLocale } from '@/i18n/routing';
import { getMemberBySupabaseUserId } from '@/server/services';
import { createRequestContext } from '@/server/context';
import { startVipCheckout } from '@/server/services/subscription-service';

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
    const context = createRequestContext({
      actor: { kind: 'member', userId: localUser.id },
      headers: request.headers,
    });

    const { searchParams } = new URL(request.url);
    const localeParam = searchParams.get('locale') ?? 'en';
    const locale = isLocale(localeParam) ? localeParam : 'en';

    const result = await startVipCheckout(localUser.id, context, locale);
    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
