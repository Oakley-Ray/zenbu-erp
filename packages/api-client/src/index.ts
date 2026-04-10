import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request interceptor: 自動帶 access token 和 tenant ID
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantId =
      typeof window !== 'undefined'
        ? localStorage.getItem('tenant_id')
        : null;
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  });

  // Response interceptor: 401 時嘗試 refresh token
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) throw new Error('No refresh token');

          const { data } = await axios.post(`${baseURL}/api/v1/auth/refresh`, {
            refreshToken,
          });

          localStorage.setItem('access_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return client(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}
