import { ERROR_CODES } from '@kclub/contracts';

import { jsonSuccess, jsonError } from '@/server/api';
import { runDailyMaintenance } from '@/server/services/maintenance-service';
import { createLogger } from '@/server/logger';

const log = createLogger();

async function handleDailyMaintenance(request: Request) {
  // Read at request time so a re-imported module (tests) and runtime always see the current value.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret) {
    return jsonError(
      { code: ERROR_CODES.SERVER_DEPENDENCY_UNAVAILABLE, message: 'CRON_SECRET is not configured' },
      undefined,
      { status: 500 },
    );
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
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

// Vercel Cron invokes the scheduled endpoint via GET, attaching `Authorization: Bearer <CRON_SECRET>`
// automatically when the CRON_SECRET env var is set on the project.
export async function GET(request: Request) {
  return handleDailyMaintenance(request);
}

// POST is retained for manual/operator invocation and existing integration coverage.
export async function POST(request: Request) {
  return handleDailyMaintenance(request);
}
