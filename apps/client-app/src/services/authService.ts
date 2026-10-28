import { axiosInstance } from './api';
import type { components } from '@shared/api-types';

type AccessTokenResponse = components['schemas']['AccessTokenResponseDto'];

// The browser only stores and sends the httpOnly refresh token cookie on
// credentialed requests, and only the auth endpoints need it.
const withRefreshCookie = { withCredentials: true };

export const loginRequest = async (
  email: string,
  password: string
): Promise<AccessTokenResponse> => {
  const response = await axiosInstance.post<AccessTokenResponse>(
    '/auth/login',
    { email, password },
    withRefreshCookie
  );
  return response.data;
};

export const refreshTokenRequest = async (): Promise<AccessTokenResponse> => {
  const response = await axiosInstance.post<AccessTokenResponse>(
    '/auth/refresh',
    undefined,
    withRefreshCookie
  );
  return response.data;
};

export const logoutRequest = async () => {
  try {
    await axiosInstance.post('/auth/logout', undefined, withRefreshCookie);
  } catch (error) {
    console.error('Logout error:', error);
  }
};
