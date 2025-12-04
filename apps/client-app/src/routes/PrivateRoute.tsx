import { Navigate, Outlet } from 'react-router-dom';
import { isTokenValid } from '../utils/tokenUtils';

export const PrivateRoute = () => {
  const token = localStorage.getItem('access_token');
  const isAuthenticated = token && isTokenValid(token);

  if (!isAuthenticated) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};
