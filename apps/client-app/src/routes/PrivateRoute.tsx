import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isTokenValid } from '../utils/tokenUtils';

export const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('access_token');
  const valid = Boolean(token && isTokenValid(token) && isAuthenticated);

  if (!valid) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
