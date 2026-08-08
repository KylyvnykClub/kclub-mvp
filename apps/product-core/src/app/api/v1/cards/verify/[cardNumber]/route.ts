import { type NextRequest } from 'next/server';

import { parseWithValidation } from '@kclub/validation';
import { cardNumberSchema } from '@/server/services/card-helpers';

import { jsonSuccess, jsonError, jsonErrorFromUnknown } from '@/server/api';
import { publicVerifyCard } from '@/server/services';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cardNumber: string }> },
) {
  try {
    const { cardNumber } = await params;

    const parsed = parseWithValidation(cardNumberSchema, cardNumber);

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

    const result = await publicVerifyCard(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
