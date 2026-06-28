import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDbClient } from '@/server/db';

export async function GET() {
  const result: any = {
    cwd: process.cwd(),
    dirname: __dirname,
    env: process.env.VERCEL ? 'VERCEL' : 'LOCAL',
    files: {},
  };

  try {
    const dbPath = path.resolve(process.cwd(), '../../packages/database/src');
    result.dbPath = dbPath;
    result.files['database_src'] = fs.existsSync(dbPath) ? fs.readdirSync(dbPath) : 'NOT_FOUND';
  } catch (e: any) {
    result.files['database_src_error'] = e.message;
  }

  try {
    const db = getDbClient();
    await db.query.businessProfiles.findFirst();
    result.db = 'SUCCESS';
  } catch (e: any) {
    result.db_error = {
      message: e.message,
      name: e.name,
      stack: e.stack,
    };
  }

  return NextResponse.json(result);
}
