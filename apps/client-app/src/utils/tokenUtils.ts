import { jwtDecode } from 'jwt-decode';

export function isTokenValid(token: string): boolean {
  try {
    const decoded: any = jwtDecode(token);
    const now = Date.now() / 1000;
    return decoded.exp && decoded.exp > now;
  } catch {
    return false;
  }
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
