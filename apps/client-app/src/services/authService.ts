import { axiosInstance } from './api';

export const loginRequest = async (email: string, password: string) => {
  const response = await axiosInstance.post('/auth/login', {
    email,
    password,
  });

  return response.data;
};

export const refreshTokenRequest = async (refreshToken: string) => {
  const response = await axiosInstance.post('/auth/refresh', {
    refresh_token: refreshToken,
  });

  return response.data;
};

export const logoutRequest = async (refreshToken: string) => {
  try {
    await axiosInstance.post('/auth/logout', {
      refresh_token: refreshToken,
    });
  } catch (error) {    
    console.error('Logout error:', error);
  }
};
