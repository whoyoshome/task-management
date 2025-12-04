import { axiosInstance } from './api';
import type { components } from '@shared/api-types';

type UserResponse = components['schemas']['UserResponseDto'];

export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await axiosInstance.get<UserResponse>('/users/me');
  return response.data;
};

export const getAllUsers = async (): Promise<UserResponse[]> => {
  const response = await axiosInstance.get<UserResponse[]>('/users');
  return response.data;
};

export const createUser = async (payload: {
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'user';
}): Promise<UserResponse> => {
  const response = await axiosInstance.post<UserResponse>('/users', payload);
  return response.data;
};
