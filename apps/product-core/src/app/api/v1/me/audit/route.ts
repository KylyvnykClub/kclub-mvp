import { type NextRequest } from 'next/server';

import { ERROR_CODES } from '@kclub/contracts';

import { createSupabaseServerClient } from '@/server/auth';
import { jsonSuccess, jsonError, jsonErrorFromUnknown } from '@/server/api';
import { getMemberBySupabaseUserId } from '@/server/services';
import { getDbClient, schema } from '@/server/db';
import { desc, eq } from 'drizzle-orm';

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

    const member = await getMemberBySupabaseUserId(supabaseUser.id);
    if (!member) {
      return jsonError(
        { code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'Member not found' },
        undefined,
        { status: 404 },
      );
    }

    const db = getDbClient();
    const entries = await db.query.auditLogs.findMany({
      where: eq(schema.auditLogs.entity_id, member.id),
      orderBy: [desc(schema.auditLogs.created_at)],
      limit: 50,
    });

    const data = entries.map((log) => ({
      id: log.id,
      actorStaffId: log.actor_staff_id ?? null,
      actorRole: log.actor_role ?? null,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      before: log.before_data ?? null,
      after: log.after_data ?? null,
      ipAddress: log.ip_address ?? null,
      createdAt: log.created_at?.toISOString() ?? new Date().toISOString(),
    }));

    return jsonSuccess(data);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
