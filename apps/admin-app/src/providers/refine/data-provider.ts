import type {
  DataProvider,
  HttpError,
  Pagination,
  CrudFilter,
  CrudSort,
} from '@refinedev/core';

const API_PROXY_URL = '/api/proxy';

async function fetcher(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let body: { error?: { code?: string; message?: string } } | null = null;
    try {
      body = await response.json();
    } catch {
      // non-JSON error response
    }

    const error: HttpError = {
      statusCode: response.status,
      message: body?.error?.message ?? response.statusText,
    };
    throw error;
  }

  return response;
}

function buildListParams(
  pagination?: Pagination,
  sorters?: CrudSort[],
  filters?: CrudFilter[],
): URLSearchParams {
  const params = new URLSearchParams();

  if (pagination && pagination.mode !== 'off') {
    params.set('page', String(pagination.currentPage ?? 1));
    params.set('limit', String(pagination.pageSize ?? 20));
  }

  if (sorters?.length) {
    params.set('sort', sorters[0].field);
    params.set('order', sorters[0].order);
  }

  if (filters?.length) {
    for (const filter of filters) {
      if ('field' in filter && filter.value != null && filter.value !== '') {
        if (filter.operator === 'eq') {
          params.set(filter.field, String(filter.value));
        } else if (filter.operator === 'contains') {
          params.set('search', String(filter.value));
        }
      }
    }
  }

  return params;
}

export const dataProvider: DataProvider = {
  getApiUrl: () => API_PROXY_URL,

  getList: async ({ resource, pagination, sorters, filters }) => {
    const params = buildListParams(pagination, sorters, filters);
    const qs = params.toString();
    const url = `${API_PROXY_URL}/${resource}${qs ? `?${qs}` : ''}`;

    const response = await fetcher(url);
    const json = await response.json();

    return {
      data: json.data ?? [],
      total: json.meta?.total ?? (json.data?.length ?? 0),
    };
  },

  getOne: async ({ resource, id }) => {
    const url = `${API_PROXY_URL}/${resource}/${id}`;
    const response = await fetcher(url);
    const json = await response.json();

    return { data: json.data };
  },

  create: async ({ resource, variables }) => {
    const url = `${API_PROXY_URL}/${resource}`;
    const response = await fetcher(url, {
      method: 'POST',
      body: JSON.stringify(variables),
    });
    const json = await response.json();

    return { data: json.data };
  },

  update: async ({ resource, id, variables, meta }) => {
    const url = `${API_PROXY_URL}/${resource}/${id}`;
    const method = meta?.method ?? 'PUT';
    const response = await fetcher(url, {
      method: method as string,
      body: JSON.stringify(variables),
    });
    const json = await response.json();

    return { data: json.data };
  },

  deleteOne: async ({ resource, id }) => {
    const url = `${API_PROXY_URL}/${resource}/${id}`;
    const response = await fetcher(url, { method: 'DELETE' });
    const json = await response.json();

    return { data: json.data };
  },

  getMany: async ({ resource, ids }) => {
    const results = await Promise.all(
      ids.map(async (id) => {
        const url = `${API_PROXY_URL}/${resource}/${id}`;
        const response = await fetcher(url);
        const json = await response.json();
        return json.data;
      }),
    );

    return { data: results };
  },

  custom: async ({ url, method, payload, query }) => {
    const params = query ? new URLSearchParams(query as Record<string, string>) : null;
    const fullUrl = `${API_PROXY_URL}${url}${params ? `?${params}` : ''}`;

    const response = await fetcher(fullUrl, {
      method: (method as string) ?? 'GET',
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    const json = await response.json();

    return { data: json.data };
  },
};
