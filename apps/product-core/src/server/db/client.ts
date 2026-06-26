import 'server-only';

import type { PrismaClient } from '@kclub/database/client';

let cachedPrisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!cachedPrisma) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient: NativePrismaClient } = require('@kclub/database/client');
    cachedPrisma = new NativePrismaClient();
  }

  return cachedPrisma!;
}

export function resetPrismaClientForTests(): void {
  if (cachedPrisma) {
    cachedPrisma.$disconnect();
    cachedPrisma = null;
  }
}
