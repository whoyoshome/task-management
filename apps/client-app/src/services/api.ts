import axios from 'axios';
import { refreshTokenRequest } from './authService';
import {
  clearSession,
  getAccessToken,
  setAccessToken,
} from '../utils/tokenUtils';

const API_URL = import.meta.env.VITE_API_URL;

export const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Request interceptor: Add token to headers
axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor: Handle 401 errors and auto-refresh
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error || {};
    const original = config || {};

    // Handle 429 (Rate Limit) with retry
    if (response?.status === 429) {
      original.__retryCount = (original.__retryCount || 0) + 1;
      if (original.__retryCount <= 2) {
        const base = Math.min(2000 * 2 ** (original.__retryCount - 1), 8000);
        const jitter = Math.floor(Math.random() * 500);
        await new Promise((r) => setTimeout(r, base + jitter));
        return axiosInstance(original);
      }
    }

    // Handle 401 (Unauthorized) - Token expired.
    // Auth endpoints are excluded: a 401 from /auth/refresh means the refresh
    // token itself is invalid, and refreshing it again would queue the
    // request behind itself and hang forever.
    if (
      response?.status === 401 &&
      !original._retry &&
      !isAuthEndpoint(original.url)
    ) {
      // Another tab may already have refreshed (refresh tokens rotate, so
      // only one tab can use a given token): retry with the stored token.
      const storedToken = getAccessToken();
      if (storedToken && storedToken !== bearerOf(original)) {
        original._retry = true;
        return axiosInstance(original);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(original);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // The refresh token goes in its httpOnly cookie; the API rotates it.
        const { access_token } = await refreshTokenRequest();
        setAccessToken(access_token);

        // Update the original request with new token
        original.headers.Authorization = `Bearer ${access_token}`;

        // Process queued requests
        processQueue(null, access_token);
        isRefreshing = false;

        // Retry the original request
        return axiosInstance(original);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        processQueue(refreshError, null);
        isRefreshing = false;
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

function isAuthEndpoint(url?: string): boolean {
  return /\/auth\/(login|refresh|logout)$/.test(url ?? '');
}

function bearerOf(config: { headers?: Record<string, unknown> }): string {
  const header = String(config.headers?.Authorization ?? '');
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
}

// Helper function to clear auth and redirect
function clearAuthAndRedirect() {
  clearSession();

  // Redirect to login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}
