import 'server-only';
import { getDbClient, resetDbClientForTests, schema } from '@kclub/database';

export { getDbClient, resetDbClientForTests, schema };

// Temporary shim for unmigrated files
export function getPrismaClient(): any {
  throw new Error('Prisma has been removed. Migrate this file to Drizzle.');
}
