export type AdminProxyRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
};

export type AdminProxyResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};
