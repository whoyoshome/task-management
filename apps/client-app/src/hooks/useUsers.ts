import { useQuery } from '@tanstack/react-query';
import { getAllUsers } from '../services/userService';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role?: string;
}

export const USERS_QUERY_KEY = ['users'] as const;

export const useUsers = () => {
  const query = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: getAllUsers,
  });

  return {
    users: query.data ?? [],
    loading: query.isLoading,
    error: query.error
      ? (query.error as { response?: { data?: { message?: string } } })
          .response?.data?.message || 'Error loading users'
      : null,
    refetch: query.refetch,
  };
};
