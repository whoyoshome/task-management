import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { renderWithProviders } from '../test-utils';

const server = vi.hoisted(() => ({ state: 'ready' }));
vi.mock('../hooks/useServerWakeUp', () => ({
  useServerWakeUp: () => server.state,
}));

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      login: vi.fn().mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } },
      }),
      isLoading: false,
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
      setUser: vi.fn(),
    }),
  };
});

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderWithProviders(<Login />, { route: '/login' });
    expect(screen.getByRole('heading', { name: /login/i })).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
  });

  it('shows error on invalid credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: '/login' });

    await user.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeTruthy();
    });
  });
});

describe('Login on a sleeping server', () => {
  it('explains the wait while the server wakes up', () => {
    server.state = 'waking';
    renderWithProviders(<Login />, { route: '/login' });

    expect(screen.getByRole('status').textContent).toMatch(/Waking up the demo server/);
    server.state = 'ready';
  });
});
