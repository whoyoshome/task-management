import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

export function AppProviders() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
