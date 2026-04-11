import type { AuthProvider } from '@refinedev/core';

const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

/**
 * Refine Auth Provider — 對接後端 /api/v1/auth/*
 * 管理登入、登出、token 儲存、身份驗證狀態。
 */
export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const tenantId = localStorage.getItem('tenant_id');
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        return { success: false, error: { message: error.message ?? '登入失敗', name: 'LoginError' } };
      }

      const data = await res.json();
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);

      // 從 JWT 解析 tenantId，確保 localStorage 一致
      try {
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]!));
        if (payload.tenantId) {
          localStorage.setItem('tenant_id', payload.tenantId);
        }
      } catch {}

      return { success: true, redirectTo: '/' };
    } catch {
      return { success: false, error: { message: '網路錯誤', name: 'NetworkError' } };
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return { success: true, redirectTo: '/login' };
  },

  check: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return { authenticated: false, redirectTo: '/login' };

    // 簡易檢查：解析 JWT payload 看是否過期
    try {
      const payload = JSON.parse(atob(token.split('.')[1]!));
      if (payload.exp * 1000 < Date.now()) {
        return { authenticated: false, redirectTo: '/login' };
      }
      return { authenticated: true };
    } catch {
      return { authenticated: false, redirectTo: '/login' };
    }
  },

  getIdentity: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]!));
      return { id: payload.sub, name: payload.sub, role: payload.role };
    } catch {
      return null;
    }
  },

  onError: async (error) => {
    if (error?.statusCode === 401) {
      return { logout: true, redirectTo: '/login' };
    }
    return { error };
  },
};
