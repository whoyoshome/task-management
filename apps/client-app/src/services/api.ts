import axios from 'axios';
import { refreshTokenRequest } from './authService';

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_MIDDLEWARE;

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'x-api-key': API_KEY,
  },
});

// Request interceptor: Add token to headers
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global lightweight request scheduler to avoid burst requests (helps prevent 429s)
let lastRequestAt = 0;
let scheduleChain: Promise<void> = Promise.resolve();
const MIN_REQUEST_GAP_MS = 500; // ensure at least 0.5s between requests from this client

axiosInstance.interceptors.request.use(async (config) => {
  const waitInChain = async () => {
    const now = Date.now();
    const wait = Math.max(0, lastRequestAt + MIN_REQUEST_GAP_MS - now);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    lastRequestAt = Date.now();
  };
  // serialize spacing across all requests
  scheduleChain = scheduleChain.then(waitInChain, waitInChain);
  await scheduleChain;
  return config;
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
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

    // Handle 401 (Unauthorized) - Token expired
    if (response?.status === 401 && !original._retry) {
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

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // No refresh token, redirect to login
        processQueue(new Error('No refresh token'), null);
        isRefreshing = false;
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      try {
        const { access_token, refresh_token: newRefreshToken } =
          await refreshTokenRequest(refreshToken);

        // Update tokens in localStorage
        localStorage.setItem('access_token', access_token);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

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

// Helper function to clear auth and redirect
function clearAuthAndRedirect() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  // Redirect to login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}
