import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest, logoutRequest } from '../services/authService';
import { getCurrentUser } from '../services/userService';
import {
  clearSession,
  dropLegacyRefreshToken,
  getUserFromStorage,
  setAccessToken,
  setUserInStorage,
} from '../utils/tokenUtils';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Whether the session is still alive depends on the httpOnly refresh cookie,
// which scripts cannot see: if it has expired, the first API call fails to
// refresh and the axios interceptor sends the user to the login page.
function readStoredUser(): AuthUser | null {
  dropLegacyRefreshToken();
  return getUserFromStorage() as AuthUser | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await loginRequest(email, password);
      setAccessToken(data.access_token);

      const currentUser = await getCurrentUser();
      setUserInStorage(currentUser);
      setUser(currentUser as AuthUser);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    await logoutRequest();
    clearSession();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      setUser,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
