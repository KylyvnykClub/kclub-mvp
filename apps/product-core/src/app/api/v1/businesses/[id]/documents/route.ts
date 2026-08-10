import { type NextRequest } from 'next/server';

import { ERROR_CODES } from '@kclub/contracts';

import { createSupabaseServerClient, createSupabaseServiceClient } from '@/server/auth';
import { jsonError, jsonErrorFromUnknown, jsonSuccess } from '@/server/api';
import { createRequestContext } from '@/server/context';
import {
  assertMemberOnboardingComplete,
  createBusinessVerificationDocument,
  getMemberBySupabaseUserId,
} from '@/server/services';

type Params = {
  params: Promise<{ id: string }>;
};

const BUSINESS_DOCUMENT_BUCKET = 'avatars';
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const DOCUMENT_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(-120);
}

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
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return jsonError(
        { code: ERROR_CODES.VALIDATION_INVALID_INPUT, message: 'A document file is required' },
        undefined,
        { status: 400 },
      );
    }

    const extension = DOCUMENT_EXTENSIONS[file.type];
    if (!extension) {
      return jsonError(
        {
          code: ERROR_CODES.VALIDATION_INVALID_INPUT,
          message: 'Use PDF, JPEG, PNG, or WebP documents only',
        },
        undefined,
        { status: 400 },
      );
    }

    if (file.size > MAX_DOCUMENT_BYTES) {
      return jsonError(
        {
          code: ERROR_CODES.VALIDATION_INVALID_INPUT,
          message: 'Document must be smaller than 10 MB',
        },
        undefined,
        { status: 400 },
      );
    }

    const localUser = await getMemberBySupabaseUserId(supabaseUser.id);
    assertMemberOnboardingComplete(localUser);

    const bytes = await file.arrayBuffer();
    const serviceClient = createSupabaseServiceClient();
    const safeFileName = sanitizeFileName(file.name || `document.${extension}`);
    const storagePath = `business-documents/${id}/${Date.now()}-${safeFileName}`;
    const { error: uploadError } = await serviceClient.storage
      .from(BUSINESS_DOCUMENT_BUCKET)
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });

    if (uploadError) {
      return jsonError(
        { code: ERROR_CODES.SERVER_DEPENDENCY_UNAVAILABLE, message: uploadError.message },
        undefined,
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = serviceClient.storage.from(BUSINESS_DOCUMENT_BUCKET).getPublicUrl(storagePath);

    const context = createRequestContext({
      actor: { kind: 'member', userId: localUser.id },
      headers: request.headers,
    });
    const document = await createBusinessVerificationDocument(
      id,
      {
        fileName: file.name || safeFileName,
        mimeType: file.type,
        fileSizeBytes: file.size,
        storagePath,
        publicUrl,
      },
      context,
    );

    return jsonSuccess(document, undefined, { status: 201 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
