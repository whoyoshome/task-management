import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyTasksPage from './MyTasks';
import Home from './Home';

const mutate = vi.fn();
const hooks = vi.hoisted(() => ({
  myTasks: [] as Array<Record<string, unknown>>,
}));

vi.mock('../hooks', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
  useProjects: () => ({
    projects: [
      { id: 'p1', name: 'Web', key: 'WEB', created_at: '2026-01-01' },
      { id: 'p2', name: 'Mobile', key: 'MOB', created_at: '2026-02-01' },
    ],
  }),
  useUsers: () => ({ users: [{ id: 'u1', full_name: 'Ana', email: 'ana@x.com' }] }),
  useMyTasks: () => ({ data: hooks.myTasks, isLoading: false, error: null }),
  useTaskCounts: () => ({
    data: {
      p1: { project_id: 'p1', total: 7, assigned_to_me: 2 },
      p2: { project_id: 'p2', total: 1, assigned_to_me: 1 },
    },
  }),
  useInvalidateTasks: () => vi.fn(),
  useUpdateTaskStatus: () => ({ mutate, isPending: false }),
  useDeleteTask: () => ({ mutate: vi.fn(), isPending: false, error: null, reset: vi.fn() }),
}));

// The modals pull their own data; they are not under test here.
vi.mock('../components/modals/CreateTaskModal', () => ({ default: () => null }));
vi.mock('../components/modals/EditTaskModal', () => ({ default: () => null }));
vi.mock('../components/modals/TaskDetailPanel', () => ({ default: () => null }));

const task = (id: string, project_id: string, status: string) => ({
  id,
  title: `Task ${id}`,
  project_id,
  status,
  assigned_to: 'u1',
  created_at: '2026-03-01',
});

beforeEach(() => {
  mutate.mockReset();
  hooks.myTasks = [
    task('t1', 'p1', 'pending'),
    task('t2', 'p1', 'in-progress'),
    task('t3', 'p2', 'completed'),
  ];
});

describe('MyTasksPage', () => {
  const renderAt = (url: string) =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <MyTasksPage />
      </MemoryRouter>
    );

  it('lists my tasks of every project by default', () => {
    renderAt('/my-tasks');

    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('filters by the project in the URL and by status', () => {
    renderAt('/my-tasks?projectId=p1');
    expect(screen.getAllByRole('article')).toHaveLength(2);

    fireEvent.click(screen.getByRole('tab', { name: 'In Progress' }));
    const [card] = screen.getAllByRole('article');
    expect(within(card).getByText('Task t2')).toBeTruthy();
  });

  it('changes a task status through the mutation', () => {
    renderAt('/my-tasks?projectId=p1');

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    expect(mutate).toHaveBeenCalledWith(
      { id: 't1', status: 'in-progress' },
      expect.anything()
    );
  });
});

describe('Home', () => {
  it('summarises my tasks and shows project totals from the counts', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Stat labels are <p>; status badges with the same text are <span>.
    const stat = (label: string) =>
      screen.getByText(label, { selector: 'p' }).nextElementSibling?.textContent;
    expect(stat('My Projects')).toBe('2');
    expect(stat('My Tasks')).toBe('3');
    expect(stat('In Progress')).toBe('1');
    expect(stat('Completed')).toBe('1');
    expect(screen.getByText('7 tasks')).toBeTruthy();
  });
});
