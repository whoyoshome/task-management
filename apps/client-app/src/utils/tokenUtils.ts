import { jwtDecode } from 'jwt-decode';

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    return typeof exp === 'number' && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

/**
 * The user is still logged in while either token is usable: an expired
 * access token is renewed with the refresh token by the axios interceptor
 * on the next request, so only an expired refresh token ends the session.
 */
export function hasValidSession(): boolean {
  return isTokenValid(getAccessToken()) || isTokenValid(getRefreshToken());
}

export function getUserFromStorage() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function removeToken() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}
