import postgres from 'postgres';
const url = process.env.DATABASE_URL_DIRECT || "postgresql://postgres.fkupuelagoabnazqbamz:n9Zw2%2FEPP-hd6mr@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
const sql = postgres(url);
try {
  await sql`ALTER TABLE business_profiles ADD COLUMN cover_image_url TEXT`;
  await sql`ALTER TABLE business_profiles ADD COLUMN logo_url TEXT`;
  console.log("Migration successful");
} catch(e) {
  console.error("Migration failed:", e);
}
process.exit(0);
