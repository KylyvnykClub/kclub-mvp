import { type NextRequest } from 'next/server';

import { memberSignUpSchema, parseWithValidation } from '@kclub/validation';

import { jsonError, jsonErrorFromUnknown, jsonSuccess } from '@/server/api';
import { createSupabaseServerClient } from '@/server/auth';
import { authLimiter, checkRateLimit } from '@/server/rate-limit';
import { startMemberSignUp } from '@/server/services';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const ip =
      request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateLimited = await checkRateLimit(authLimiter, ip);
    if (rateLimited) return rateLimited;

    const parsed = parseWithValidation(memberSignUpSchema, await request.json());
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

    const result = await startMemberSignUp(await createSupabaseServerClient(), parsed.data);
    return jsonSuccess(result, undefined, { status: 200 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
