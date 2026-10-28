import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { axiosInstance } from './api';

type Handler = (config: InternalAxiosRequestConfig) => {
  status: number;
  data?: unknown;
};

// Route every request through a fake adapter so the real interceptors run.
function mockServer(handler: Handler) {
  const calls: InternalAxiosRequestConfig[] = [];
  axiosInstance.defaults.adapter = async (config) => {
    calls.push(config);
    const { status, data } = handler(config);
    const response = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) {
      throw new AxiosError('Request failed', undefined, config, null, response);
    }
    return response;
  };
  return calls;
}

const authHeader = (config: InternalAxiosRequestConfig) =>
  String(config.headers.Authorization ?? '');

describe('axiosInstance auth interceptor', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'expired-access');
    localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));
    // clearAuthAndRedirect only redirects outside /login.
    window.history.pushState({}, '', '/login');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('refreshes an expired access token with the cookie, stores it and retries', async () => {
    const calls = mockServer((config) => {
      if (config.url === '/auth/refresh') {
        return { status: 200, data: { access_token: 'new-access' } };
      }
      return authHeader(config) === 'Bearer new-access'
        ? { status: 200, data: ['task'] }
        : { status: 401 };
    });

    const response = await axiosInstance.get('/tasks/mine');

    expect(response.data).toEqual(['task']);
    expect(localStorage.getItem('access_token')).toBe('new-access');
    expect(calls.map((c) => c.url)).toEqual([
      '/tasks/mine',
      '/auth/refresh',
      '/tasks/mine',
    ]);
    // The refresh token travels in its httpOnly cookie, never in the body.
    const refresh = calls[1];
    expect(refresh.withCredentials).toBe(true);
    expect(refresh.data).toBeUndefined();
    // Only the auth endpoints send the cookie.
    expect(calls[0].withCredentials).toBeFalsy();
  });

  it('logs out instead of hanging when the refresh cookie is rejected', async () => {
    const calls = mockServer(() => ({ status: 401 }));

    await expect(axiosInstance.get('/tasks/mine')).rejects.toBeInstanceOf(
      AxiosError
    );

    expect(calls.map((c) => c.url)).toEqual(['/tasks/mine', '/auth/refresh']);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('reuses a token another tab already refreshed instead of rotating again', async () => {
    const calls = mockServer((config) => {
      if (authHeader(config) === 'Bearer stale-access') {
        // Simulate the other tab finishing its refresh meanwhile.
        localStorage.setItem('access_token', 'fresh-from-other-tab');
        return { status: 401 };
      }
      return authHeader(config) === 'Bearer fresh-from-other-tab'
        ? { status: 200, data: 'ok' }
        : { status: 401 };
    });
    localStorage.setItem('access_token', 'stale-access');

    const response = await axiosInstance.get('/projects');

    expect(response.data).toBe('ok');
    expect(calls.some((c) => c.url === '/auth/refresh')).toBe(false);
  });
});
