import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProjectsPage from './Projects';

const auth = vi.hoisted(() => ({ role: 'user' }));

vi.mock('../hooks', () => ({
  useAuth: () => ({ user: { id: 'u1', role: auth.role } }),
  useProjects: () => ({
    projects: [
      { id: 'p1', name: 'Web', key: 'WEB', description: 'Website', member_count: 3 },
    ],
    loading: false,
    refetch: vi.fn(),
  }),
  useTaskCounts: () => ({
    data: { p1: { project_id: 'p1', total: 7, assigned_to_me: 2 } },
  }),
}));

vi.mock('../components/modals/CreateProjectModal', () => ({ default: () => null }));
vi.mock('../components/modals/EditProjectModal', () => ({ default: () => null }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProjectsPage />
    </MemoryRouter>
  );

beforeEach(() => {
  auth.role = 'user';
});

describe('ProjectsPage', () => {
  it('shows the real member and task counts', () => {
    renderPage();

    expect(screen.getByText('3 members')).toBeTruthy();
    expect(screen.getByText(/7 tasks • 2 mine/)).toBeTruthy();
  });

  it('hides project management from non-admins', () => {
    renderPage();

    expect(screen.queryByRole('button', { name: /New Project/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit Web' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete Web' })).toBeNull();
  });

  it('lets admins create, edit and delete projects', () => {
    auth.role = 'admin';
    renderPage();

    expect(screen.getByRole('button', { name: /New Project/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit Web' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete Web' })).toBeTruthy();
  });
});
