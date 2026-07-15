// Temporary: minimal pooler connectivity test — delete after use.
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('no DATABASE_URL');

const t0 = Date.now();
const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 10 });
try {
  const one = await sql`select 1 as one`;
  console.log(`select 1 -> ${JSON.stringify(one)} in ${Date.now() - t0}ms`);
  const t1 = Date.now();
  const counts = await Promise.all([
    sql`select count(*) from users`,
    sql`select count(*) from business_profiles`,
    sql`select count(*) from vip_subscriptions`,
  ]);
  console.log(`3 parallel counts in ${Date.now() - t1}ms: ${JSON.stringify(counts.flat())}`);
} catch (e) {
  console.error(`FAILED after ${Date.now() - t0}ms:`, String(e));
} finally {
  await sql.end({ timeout: 5 });
}
process.exit(0);
