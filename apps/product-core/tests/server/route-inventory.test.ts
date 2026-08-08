import { existsSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const FORBIDDEN_PRODUCTION_ROUTES = ['src/app/api/debug-prisma/route.ts'] as const;

function resolveFromProductCore(relativePath: string): string {
  return path.resolve(process.cwd(), relativePath);
}

describe('production route inventory', () => {
  test('does not include debug-only API routes', () => {
    for (const routePath of FORBIDDEN_PRODUCTION_ROUTES) {
      expect(
        existsSync(resolveFromProductCore(routePath)),
        `${routePath} must stay out of production builds`,
      ).toBe(false);
    }
  });
});
