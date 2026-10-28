/**
 * The access token and the user live in localStorage so every tab shares
 * them. The refresh token never reaches JavaScript: the API keeps it in an
 * httpOnly cookie and the axios interceptor renews the access token with it.
 */
const ACCESS_TOKEN = 'access_token';
const USER = 'user';
// Stored by versions that kept the refresh token in localStorage.
const LEGACY_REFRESH_TOKEN = 'refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN, token);
}

export function getUserFromStorage() {
  const user = localStorage.getItem(USER);
  return user ? JSON.parse(user) : null;
}

export function setUserInStorage(user: unknown): void {
  localStorage.setItem(USER, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(USER);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN);
}

/** Removes a readable refresh token left by an older version of the app. */
export function dropLegacyRefreshToken(): void {
  localStorage.removeItem(LEGACY_REFRESH_TOKEN);
}
