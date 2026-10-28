import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// An expired access token alone must not log the user out: the axios
// interceptor renews it with the refresh cookie on the next 401, and only
// sends the user to the login page if that fails.
export const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
