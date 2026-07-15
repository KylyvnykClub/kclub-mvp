export type AdminProxyRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
  /** Abort the upstream request after this many ms (default 15000). */
  timeoutMs?: number;
};

export type AdminProxyResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};
