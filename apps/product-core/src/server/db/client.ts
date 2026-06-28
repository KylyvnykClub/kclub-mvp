import 'server-only';
import { getDbClient as getDrizzleClient, schema, relations } from '@kclub/database';

export function getDbClient() {
  return getDrizzleClient();
}

export function resetDbClientForTests(): void {
  // Not strictly needed for Drizzle, as it doesn't maintain stateful locked connections like Prisma
}

export { schema, relations };
