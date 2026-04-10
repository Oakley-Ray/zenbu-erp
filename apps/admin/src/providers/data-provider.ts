import type { DataProvider } from '@refinedev/core';

const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

/** 取得帶認證的 headers */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('access_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const tenantId = localStorage.getItem('tenant_id');
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  return headers;
}

/**
 * Refine Data Provider — 對接 NestJS REST API。
 * Refine 會根據 resource 名稱自動呼叫 getList/getOne/create/update/deleteOne。
 */
export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, sorters, filters }) => {
    const params = new URLSearchParams();

    if (pagination?.current) params.set('page', String(pagination.current));
    if (pagination?.pageSize) params.set('limit', String(pagination.pageSize));

    if (sorters?.[0]) {
      params.set('sort', sorters[0].field);
      params.set('order', sorters[0].order);
    }

    const res = await fetch(`${API_URL}/${resource}?${params}`, { headers: getHeaders() });
    const json = await res.json();

    // 相容後端回傳 { data, meta } 或直接回傳 array
    if (Array.isArray(json)) {
      return { data: json, total: json.length };
    }
    return { data: json.data ?? json, total: json.meta?.total ?? json.length ?? 0 };
  },

  getOne: async ({ resource, id }) => {
    const res = await fetch(`${API_URL}/${resource}/${id}`, { headers: getHeaders() });
    const data = await res.json();
    return { data };
  },

  create: async ({ resource, variables }) => {
    const res = await fetch(`${API_URL}/${resource}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(variables),
    });
    const data = await res.json();
    return { data };
  },

  update: async ({ resource, id, variables }) => {
    const res = await fetch(`${API_URL}/${resource}/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(variables),
    });
    const data = await res.json();
    return { data };
  },

  deleteOne: async ({ resource, id }) => {
    const res = await fetch(`${API_URL}/${resource}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    return { data };
  },

  getApiUrl: () => API_URL,
};
