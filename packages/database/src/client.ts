import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

const fullSchema = { ...schema, ...relations };

let connection: postgres.Sql;
let db: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDbClient() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    connection = postgres(connectionString, { prepare: false });
    db = drizzle(connection, { schema: fullSchema });
  }
  return db;
}

export { schema, relations };
