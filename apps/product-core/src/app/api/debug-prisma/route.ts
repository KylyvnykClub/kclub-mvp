import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getPrismaClient } from '@/server/db';

export async function GET() {
  const result: any = {
    cwd: process.cwd(),
    dirname: __dirname,
    env: process.env.VERCEL ? 'VERCEL' : 'LOCAL',
    files: {},
  };

  try {
    const dbPath = path.resolve(process.cwd(), '../../packages/database/src/generated/client');
    result.dbPath = dbPath;
    result.files['generated_client'] = fs.existsSync(dbPath) ? fs.readdirSync(dbPath) : 'NOT_FOUND';
  } catch (e: any) {
    result.files['generated_client_error'] = e.message;
  }

  try {
    // Try to instantiate Prisma and catch the exact error
    const prisma = getPrismaClient();
    await prisma.businessProfile.findFirst();
    result.prisma = 'SUCCESS';
  } catch (e: any) {
    result.prisma_error = {
      message: e.message,
      name: e.name,
      stack: e.stack,
    };
  }

  return NextResponse.json(result);
}
