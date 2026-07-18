import { vi } from 'vitest';

export const mockCookieStore = {
  get: vi.fn((_name: string) => undefined as { value: string } | undefined),
  set: vi.fn((_name: string, _value: string, _options?: unknown) => {}),
};

export function resetMockCookieStore() {
  mockCookieStore.get.mockReset();
  mockCookieStore.get.mockImplementation((_name: string) => undefined);
  mockCookieStore.set.mockReset();
}
