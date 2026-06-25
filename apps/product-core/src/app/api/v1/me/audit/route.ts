import { type NextRequest } from 'next/server';

import { ERROR_CODES } from '@kclub/contracts';

import { createSupabaseServerClient } from '@/server/auth';
import { jsonSuccess, jsonError, jsonErrorFromUnknown } from '@/server/api';
import { getMemberBySupabaseUserId } from '@/server/services';
import { getPrismaClient } from '@/server/db';

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

    const prisma = getPrismaClient();
    const entries = await prisma.auditLog.findMany({
      where: { entity_id: member.id },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    const data = entries.map((log: any) => ({
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
