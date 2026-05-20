import axios, { AxiosHeaders } from 'axios';
import { useAuthStore } from '../auth/store';

// Use the Next rewrite proxy so cookies are first-party on the frontend domain.
const api = axios.create({
  baseURL: '/api-proxy',
  withCredentials: true,
});

// Keep a lightweight interceptor for tenant header only. Do NOT add Authorization headers —
// auth is based on httpOnly cookies set by the backend.
api.interceptors.request.use((config) => {
  const { currentTenant } = useAuthStore.getState();
  if (currentTenant) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('X-Tenant-ID', currentTenant.id);
    config.headers = headers;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (val: any) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, value: any = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(value)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const skipRedirect = originalRequest.headers?.['X-Skip-Auth-Redirect'] === 'true';

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      if (skipRedirect) return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Ask backend to rotate refresh token (backend will read ciap_refresh cookie)
        await axios.post('/api-proxy/auth/refresh', {}, { withCredentials: true });

        // Obtain current user/session info
        const verifyResp = await api.get('/auth/verify', { withCredentials: true });
        const user = verifyResp.data;
        useAuthStore.getState().setAuth(user);

        processQueue(null, null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
