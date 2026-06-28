import { ERROR_CODES } from '@kclub/contracts';

import { jsonSuccess, jsonError } from '@/server/api';
import { runDailyMaintenance } from '@/server/services/maintenance-service';
import { createLogger } from '@/server/logger';

export async function POST(request: Request) {
  const log = createLogger();
  const CRON_SECRET = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!CRON_SECRET) {
    return jsonError(
      { code: ERROR_CODES.SERVER_DEPENDENCY_UNAVAILABLE, message: 'CRON_SECRET is not configured' },
      undefined,
      { status: 500 },
    );
  }

  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    return jsonError(
      { code: ERROR_CODES.PERMISSION_DENIED, message: 'Invalid or missing cron authorization' },
      undefined,
      { status: 401 },
    );
  }

  try {
    log.cron('Daily maintenance started');
    const result = await runDailyMaintenance();
    log.cron('Daily maintenance completed', {
      expiredCards: result.expiredCards,
      expiredSubscriptions: result.expiredSubscriptions,
      hiddenBusinesses: result.hiddenBusinesses,
      cleanedEvents: result.cleanedEvents,
    });
    return jsonSuccess(result);
  } catch (error) {
    log.error('Daily maintenance failed', { domain: 'cron', error });
    return jsonError(
      { code: ERROR_CODES.SERVER_ERROR, message: 'Daily maintenance failed' },
      undefined,
      { status: 500 },
    );
  }
}
