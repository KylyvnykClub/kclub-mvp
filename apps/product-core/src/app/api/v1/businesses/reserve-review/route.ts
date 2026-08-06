import { type NextRequest } from 'next/server';

import { ERROR_CODES } from '@kclub/contracts';
import { businessProfileSubmitSchema } from '@kclub/validation';

import { createSupabaseServerClient } from '@/server/auth';
import { jsonSuccess, jsonError, jsonErrorFromUnknown } from '@/server/api';
import { createRequestContext } from '@/server/context';
import { getMemberBySupabaseUserId, assertMemberOnboardingComplete } from '@/server/services';
import { startBusinessReviewReserveCheckout } from '@/server/services/business-service';
import { defaultLocale, isLocale } from '@/i18n/routing';

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
    const input = businessProfileSubmitSchema.parse(body);
    const { searchParams } = new URL(request.url);
    const requestedLocale = searchParams.get('locale') ?? defaultLocale;
    const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;

    const checkout = await startBusinessReviewReserveCheckout(input, context, locale);
    return jsonSuccess(checkout, undefined, { status: 201 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
