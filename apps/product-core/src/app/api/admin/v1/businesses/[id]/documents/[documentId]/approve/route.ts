import { type NextRequest } from 'next/server';

import { STAFF_PERMISSIONS } from '@kclub/contracts';

import { adminGuard } from '@/server/admin-guard';
import { jsonErrorFromUnknown, jsonSuccess } from '@/server/api';
import { approveBusinessVerificationDocument } from '@/server/services/admin-service';

type Params = {
  params: Promise<{ id: string; documentId: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { context } = await adminGuard(request, STAFF_PERMISSIONS.BUSINESSES_MODERATE);
    const { id, documentId } = await params;
    const result = await approveBusinessVerificationDocument(id, documentId, context);
    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
