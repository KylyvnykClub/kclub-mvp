import { mock } from 'bun:test';

export const mockCookieStore = {
  get: mock((_name: string) => undefined as { value: string } | undefined),
  set: mock((_name: string, _value: string, _options?: unknown) => {}),
};

export function resetMockCookieStore() {
  mockCookieStore.get.mockReset();
  mockCookieStore.get.mockImplementation((_name: string) => undefined);
  mockCookieStore.set.mockReset();
}
