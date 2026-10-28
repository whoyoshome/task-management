import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasValidSession } from '../utils/tokenUtils';

export const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();

  // An expired access token alone must not log the user out: the axios
  // interceptor refreshes it on the next 401 while the refresh token lives.
  if (!isAuthenticated || !hasValidSession()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
