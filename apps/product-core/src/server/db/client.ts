import 'server-only';

import { PrismaClient } from '@kclub/database/client';

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
