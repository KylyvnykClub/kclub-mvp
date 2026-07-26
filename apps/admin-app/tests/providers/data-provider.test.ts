import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dataProvider } from '@/providers/refine/data-provider';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('dataProvider', () => {
  describe('getApiUrl', () => {
    it('returns the proxy base URL', () => {
      expect(dataProvider.getApiUrl()).toBe('/api/proxy');
    });
  });

  describe('getList', () => {
    it('maps pagination params to page/limit', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ data: [{ id: '1' }], meta: { page: 2, limit: 10, total: 25 }, error: null }),
      );

      const result = await dataProvider.getList({
        resource: 'users',
        pagination: { currentPage: 2, pageSize: 10 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/proxy/users?page=2&limit=10',
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      );
      expect(result.data).toEqual([{ id: '1' }]);
      expect(result.total).toBe(25);
    });

    it('returns data.length as total when meta.total is absent', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: '1' }, { id: '2' }],
          meta: { timestamp: '2026-01-01' },
          error: null,
        }),
      );

      const result = await dataProvider.getList({
        resource: 'categories',
        pagination: { mode: 'off' },
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/proxy/categories', expect.anything());
      expect(result.total).toBe(2);
    });

    it('maps eq filters to query params', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ data: [], meta: { page: 1, limit: 20, total: 0 }, error: null }),
      );

      await dataProvider.getList({
        resource: 'cards',
        pagination: { currentPage: 1, pageSize: 20 },
        filters: [
          { field: 'status', operator: 'eq', value: 'ACTIVE' },
          { field: 'membershipTier', operator: 'eq', value: 'GOLD' },
        ],
      });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      const params = new URLSearchParams(calledUrl.split('?')[1]!);
      expect(params.get('status')).toBe('ACTIVE');
      expect(params.get('membershipTier')).toBe('GOLD');
    });

    it('maps contains filter to search param', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ data: [], meta: { page: 1, limit: 20, total: 0 }, error: null }),
      );

      await dataProvider.getList({
        resource: 'users',
        pagination: { currentPage: 1, pageSize: 20 },
        filters: [{ field: 'search', operator: 'contains', value: 'john' }],
      });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      const params = new URLSearchParams(calledUrl.split('?')[1]!);
      expect(params.get('search')).toBe('john');
    });

    it('skips filters with empty/null values', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ data: [], meta: { total: 0 }, error: null }));

      await dataProvider.getList({
        resource: 'users',
        pagination: { currentPage: 1, pageSize: 20 },
        filters: [
          { field: 'status', operator: 'eq', value: '' },
          { field: 'tier', operator: 'eq', value: null },
        ],
      });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      const params = new URLSearchParams(calledUrl.split('?')[1]!);
      expect(params.has('status')).toBe(false);
      expect(params.has('tier')).toBe(false);
    });
  });

  describe('getOne', () => {
    it('unwraps the envelope and returns data', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          data: { id: 'abc', name: 'Test' },
          meta: { timestamp: '2026-01-01' },
          error: null,
        }),
      );

      const result = await dataProvider.getOne({ resource: 'categories', id: 'abc' });

      expect(mockFetch).toHaveBeenCalledWith('/api/proxy/categories/abc', expect.anything());
      expect(result.data).toEqual({ id: 'abc', name: 'Test' });
    });
  });

  describe('create', () => {
    it('POSTs to the resource URL and unwraps response', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ data: { id: 'new-1', name: 'New Cat' }, error: null }),
      );

      const result = await dataProvider.create({
        resource: 'categories',
        variables: { name: 'New Cat', slug: 'new-cat' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/proxy/categories',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New Cat', slug: 'new-cat' }),
        }),
      );
      expect(result.data).toEqual({ id: 'new-1', name: 'New Cat' });
    });
  });

  describe('update', () => {
    it('defaults to PUT method', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ data: { id: 'c1', name: 'Updated' }, error: null }),
      );

      await dataProvider.update({
        resource: 'categories',
        id: 'c1',
        variables: { name: 'Updated' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/proxy/categories/c1',
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('respects meta.method override for PATCH', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ data: { id: 'b1', name: 'Patched' }, error: null }),
      );

      await dataProvider.update({
        resource: 'businesses',
        id: 'b1',
        variables: { name: 'Patched' },
        meta: { method: 'PATCH' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/proxy/businesses/b1',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('deleteOne', () => {
    it('sends DELETE and unwraps response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ data: { success: true }, error: null }));

      const result = await dataProvider.deleteOne({ resource: 'categories', id: 'c1' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/proxy/categories/c1',
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('error handling', () => {
    it('throws HttpError with message from envelope error', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: null,
            error: { code: 'PERMISSION_DENIED', message: 'Forbidden' },
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        ),
      );

      await expect(dataProvider.getOne({ resource: 'users', id: '1' })).rejects.toMatchObject({
        statusCode: 403,
        message: 'Forbidden',
      });
    });

    it('throws HttpError with statusText when body is not JSON', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' }),
      );

      await expect(dataProvider.getList({ resource: 'users' })).rejects.toMatchObject({
        statusCode: 500,
        message: 'Internal Server Error',
      });
    });

    it('throws HttpError on 401 unauthenticated', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: null,
            error: { code: 'UNAUTHENTICATED', message: 'No staff session' },
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        ),
      );

      await expect(dataProvider.getList({ resource: 'staff' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'No staff session',
      });
    });
  });

  describe('custom', () => {
    it('calls a custom endpoint via proxy', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ data: { success: true }, error: null }));

      const result = await dataProvider.custom!({
        url: '/businesses/b1/approve',
        method: 'post',
        payload: { notes: 'Looks good' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/proxy/businesses/b1/approve',
        expect.objectContaining({
          method: 'post',
          body: JSON.stringify({ notes: 'Looks good' }),
        }),
      );
      expect(result.data).toEqual({ success: true });
    });
  });
});
