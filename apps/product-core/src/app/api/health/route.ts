import { getDbClient } from '@/server/db';
import { jsonSuccess } from '@/server/api';
import { sql } from 'drizzle-orm';

type HealthDependency = {
  database: 'ok' | 'down';
};

type HealthResult = {
  status: 'ok' | 'degraded';
  app: string;
  dependencies: HealthDependency;
};

async function checkDatabase(): Promise<'ok' | 'down'> {
  try {
    const db = getDbClient();
    await db.execute(sql`SELECT 1`);
    return 'ok';
  } catch {
    return 'down';
  }
}

export async function GET() {
  const database = await checkDatabase();
  const overall = database === 'ok' ? 'ok' : 'degraded';

  const result: HealthResult = {
    status: overall,
    app: 'product-core',
    dependencies: { database },
  };

  return jsonSuccess(result);
}
