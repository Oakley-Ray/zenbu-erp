import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('access_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const tenantId = localStorage.getItem('tenant_id');
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  return headers;
}

/** 通用 GET hook — 自動帶 JWT + Tenant ID。傳入 null 時跳過請求。 */
export function useFetch<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!path) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetch(`${API_URL}${path}`, { headers: getHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<T>;
      })
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

/** 通用 mutation（POST / PATCH / DELETE） */
export async function apiRequest<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST',
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `${res.status} ${res.statusText}`);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
