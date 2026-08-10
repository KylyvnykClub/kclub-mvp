import { type NextRequest } from 'next/server';

import { ERROR_CODES } from '@kclub/contracts';

import { createSupabaseServerClient, createSupabaseServiceClient } from '@/server/auth';
import { jsonError, jsonErrorFromUnknown, jsonSuccess } from '@/server/api';
import { createRequestContext } from '@/server/context';
import { assertMemberOnboardingComplete, getMemberBySupabaseUserId } from '@/server/services';
import { getOwnBusinesses, updateBusiness } from '@/server/services/business-service';

type Params = {
  params: Promise<{ id: string }>;
};

const BUSINESS_MEDIA_BUCKET = 'avatars';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
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
    const kind = formData.get('kind');
    const file = formData.get('file');

    if ((kind !== 'cover' && kind !== 'logo') || !file || typeof file === 'string') {
      return jsonError(
        {
          code: ERROR_CODES.VALIDATION_INVALID_INPUT,
          message: 'A cover or logo image is required',
        },
        undefined,
        { status: 400 },
      );
    }

    const extension = IMAGE_EXTENSIONS[file.type];
    if (!extension) {
      return jsonError(
        {
          code: ERROR_CODES.VALIDATION_INVALID_INPUT,
          message: 'Use a JPEG, PNG, or WebP image',
        },
        undefined,
        { status: 400 },
      );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return jsonError(
        { code: ERROR_CODES.VALIDATION_INVALID_INPUT, message: 'Image must be smaller than 5 MB' },
        undefined,
        { status: 400 },
      );
    }

    const localUser = await getMemberBySupabaseUserId(supabaseUser.id);
    assertMemberOnboardingComplete(localUser);
    const context = createRequestContext({
      actor: { kind: 'member', userId: localUser.id },
      headers: request.headers,
    });
    const ownBusinesses = await getOwnBusinesses(localUser.id);
    if (!ownBusinesses.some((business) => business.id === id)) {
      return jsonError(
        {
          code: ERROR_CODES.PERMISSION_DENIED,
          message: 'You do not have permission to edit this business',
        },
        undefined,
        { status: 403 },
      );
    }
    const storagePath = `businesses/${id}/${kind}.${extension}`;
    const bytes = await file.arrayBuffer();
    const serviceClient = createSupabaseServiceClient();
    const { error: uploadError } = await serviceClient.storage
      .from(BUSINESS_MEDIA_BUCKET)
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
    } = serviceClient.storage.from(BUSINESS_MEDIA_BUCKET).getPublicUrl(storagePath);
    const business = await updateBusiness(
      id,
      kind === 'cover' ? { coverImageUrl: publicUrl } : { logoUrl: publicUrl },
      context,
    );

    return jsonSuccess(business);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
