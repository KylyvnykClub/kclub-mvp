import { vi } from 'vitest';

import { mockCookieStore } from './test-helpers/mock-cookies';

// Registered here (setupFiles runs before every test file) so `next/headers`
// resolves consistently across files. Individual files may override with their
// own vi.mock — Vitest re-registers per file. JSDOM globals come from
// environment: 'jsdom'.
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));
