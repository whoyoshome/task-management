import { useMemo } from 'react';
import {
  getUserFromStorage,
  removeToken,
  getRefreshToken,
} from '../utils/tokenUtils';
import { useNavigate } from 'react-router-dom';
import { logoutRequest } from '../services/authService';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export const useAuth = () => {
  const navigate = useNavigate();

  const user = useMemo<User | null>(() => {
    return getUserFromStorage();
  }, []);

  const isAuthenticated = useMemo(() => {
    return !!user;
  }, [user]);

  const logout = async () => {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      await logoutRequest(refreshToken);
    }

    removeToken();
    navigate('/login');
  };

  return {
    user,
    isAuthenticated,
    logout,
  };
};
