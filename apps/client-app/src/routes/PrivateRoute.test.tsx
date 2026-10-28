import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { fakeJwt } from '../test-utils';

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

const HOUR = 3600;

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
    localStorage.clear();
    auth.isAuthenticated = false;
  });

  it('redirects to login without a session', () => {
    renderProtectedRoute();

    expect(screen.getByText('Login page')).toBeTruthy();
  });

  it('keeps the user in when only the access token has expired', () => {
    auth.isAuthenticated = true;
    localStorage.setItem('access_token', fakeJwt(-HOUR));
    localStorage.setItem('refresh_token', fakeJwt(7 * 24 * HOUR));

    renderProtectedRoute();

    expect(screen.getByText('Protected content')).toBeTruthy();
  });

  it('redirects to login when both tokens have expired', () => {
    auth.isAuthenticated = true;
    localStorage.setItem('access_token', fakeJwt(-HOUR));
    localStorage.setItem('refresh_token', fakeJwt(-HOUR));

    renderProtectedRoute();

    expect(screen.getByText('Login page')).toBeTruthy();
  });
});
