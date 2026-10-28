import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';

const auth = vi.hoisted(() => ({ isAuthenticated: false }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: auth.isAuthenticated,
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
  }),
}));

function renderProtectedRoute() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<div>Protected content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PrivateRoute', () => {
  afterEach(() => {
    auth.isAuthenticated = false;
  });

  it('redirects to login without a session', () => {
    renderProtectedRoute();

    expect(screen.getByText('Login page')).toBeTruthy();
  });

  it('lets a logged-in user in, whatever the state of the access token', () => {
    // Token expiry is handled by the axios interceptor, not by the route.
    auth.isAuthenticated = true;

    renderProtectedRoute();

    expect(screen.getByText('Protected content')).toBeTruthy();
  });
});
