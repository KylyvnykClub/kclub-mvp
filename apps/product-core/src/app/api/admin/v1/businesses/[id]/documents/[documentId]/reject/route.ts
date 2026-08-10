import { type NextRequest } from 'next/server';

import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { businessDocumentRejectSchema } from '@kclub/validation';

import { adminGuard } from '@/server/admin-guard';
import { jsonErrorFromUnknown, jsonSuccess } from '@/server/api';
import { rejectBusinessVerificationDocument } from '@/server/services/admin-service';

type Params = {
  params: Promise<{ id: string; documentId: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { context } = await adminGuard(request, STAFF_PERMISSIONS.BUSINESSES_MODERATE);
    const { id, documentId } = await params;
    const body = await request.json();
    const input = businessDocumentRejectSchema.parse(body);
    const result = await rejectBusinessVerificationDocument(id, documentId, input, context);
    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
