import { type NextRequest } from 'next/server';

import { ERROR_CODES } from '@kclub/contracts';

import { createSupabaseServerClient } from '@/server/auth';
import { jsonSuccess, jsonError, jsonErrorFromUnknown } from '@/server/api';
import { getMemberBySupabaseUserId } from '@/server/services';
import { getDbClient, schema } from '@/server/db';
import { and, eq, notInArray } from 'drizzle-orm';
import { getIncomingIntroductions } from '@/server/services/introduction-service';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      return jsonError({ code: ERROR_CODES.AUTH_SESSION_REQUIRED, message: 'Authentication required' }, undefined, { status: 401 });
    }

    const localUser = await getMemberBySupabaseUserId(supabaseUser.id);
    const db = getDbClient();
    const business = await db.query.businessProfiles.findFirst({
      where: and(
        eq(schema.businessProfiles.user_id, localUser.id),
        notInArray(schema.businessProfiles.status, ['REJECTED', 'HIDDEN'])
      ),
    });

    if (!business) {
      return jsonError({ code: ERROR_CODES.PERMISSION_DENIED, message: 'No active business found' }, undefined, { status: 403 });
    }

    const introductions = await getIncomingIntroductions(business.id);
    return jsonSuccess(introductions);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
