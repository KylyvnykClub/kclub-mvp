import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let dbClient: PostgresJsDatabase<typeof schema> | null = null;
let queryClient: ReturnType<typeof postgres> | null = null;

export function getDbClient(): PostgresJsDatabase<typeof schema> {
  if (!dbClient) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // For Vercel Serverless, limit max connections
    queryClient = postgres(connectionString, { max: 10 });
    dbClient = drizzle(queryClient, { schema });
  }

  return dbClient;
}

export function resetDbClientForTests() {
  if (queryClient) {
    queryClient.end();
    queryClient = null;
    dbClient = null;
  }
}

export { schema };
