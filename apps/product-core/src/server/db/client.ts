import 'server-only';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@kclub/database/client';

if (process.env.VERCEL) {
  // On Vercel, Next.js bundles Prisma and corrupts its __dirname.
  // However, Next.js NFT trace copies the engine to the original folder.
  // We can explicitly tell Prisma where the engine is!
  const engineDir = path.resolve(process.cwd(), '../../packages/database/src/generated/client');
  if (fs.existsSync(engineDir)) {
    const files = fs.readdirSync(engineDir);
    const engineFile = files.find(f => f.startsWith('libquery_engine') && f.endsWith('.so.node'));
    if (engineFile) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(engineDir, engineFile);
    }
  }
}

let cachedPrisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!cachedPrisma) {
    cachedPrisma = new PrismaClient();
  }

  return cachedPrisma!;
}

export function resetPrismaClientForTests(): void {
  if (cachedPrisma) {
    cachedPrisma.$disconnect();
    cachedPrisma = null;
  }
}
