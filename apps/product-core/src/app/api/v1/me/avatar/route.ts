import { type NextRequest } from 'next/server';

import { ERROR_CODES } from '@kclub/contracts';

import { createSupabaseServerClient, createSupabaseServiceClient } from '@/server/auth';
import { jsonSuccess, jsonError, jsonErrorFromUnknown } from '@/server/api';
import { getMemberBySupabaseUserId, toCurrentMemberProfileDto, type UserRecord } from '@/server/services';
import { getDbClient, schema } from '@/server/db';
import { eq } from 'drizzle-orm';
import { createRequestContext } from '@/server/context';
import { createDbAuditService } from '@/server/audit';

const auditService = createDbAuditService();

const AVATAR_BUCKET = 'avatars';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return jsonError(
        { code: ERROR_CODES.VALIDATION_INVALID_INPUT, message: 'No file provided' },
        undefined,
        { status: 400 },
      );
    }

    if (!file.type.startsWith('image/')) {
      return jsonError(
        { code: ERROR_CODES.VALIDATION_INVALID_INPUT, message: 'File must be an image' },
        undefined,
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return jsonError(
        { code: ERROR_CODES.VALIDATION_INVALID_INPUT, message: 'Image must be smaller than 5 MB' },
        undefined,
        { status: 400 },
      );
    }

    const localUser = await getMemberBySupabaseUserId(supabaseUser.id);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const storagePath = `${localUser.id}/avatar.${ext}`;

    const bytes = await file.arrayBuffer();
    const serviceClient = createSupabaseServiceClient();

    const { error: uploadError } = await serviceClient.storage
      .from(AVATAR_BUCKET)
      .upload(storagePath, bytes, { contentType: file.type, upsert: true });

    if (uploadError) {
      return jsonError(
        { code: ERROR_CODES.VALIDATION_INVALID_INPUT, message: uploadError.message },
        undefined,
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = serviceClient.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);

    const db = getDbClient();
    const [updated] = await db
      .update(schema.users)
      .set({ avatar_url: publicUrl })
      .where(eq(schema.users.id, localUser.id))
      .returning();

    const context = createRequestContext({
      actor: { kind: 'member', userId: localUser.id },
      headers: request.headers,
    });
    await auditService.log(
      { action: 'USER_AVATAR_UPDATED', entityType: 'User', entityId: localUser.id },
      context,
    );

    return jsonSuccess(toCurrentMemberProfileDto(updated as UserRecord));
  } catch (err) {
    return jsonErrorFromUnknown(err);
  }
}
