import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import ProjectPage from './ProjectPage';
import { createTestQueryClient } from '../test-utils';

const access = vi.hoisted(() => ({ canCreateTasks: true }));
const mutate = vi.fn();

vi.mock('../hooks', () => ({
  useAuth: () => ({ user: { id: 'me' } }),
  useUsers: () => ({ users: [] }),
  useInvalidateTasks: () => vi.fn(),
  useProjectMembers: () => ({
    project: { id: 'p1', name: 'Web', key: 'WEB', description: 'Website' },
    members: [
      { user_id: 'me', role: 'member', full_name: 'Me', email: 'me@x.com' },
      { user_id: 'ana', role: 'member', full_name: 'Ana', email: 'ana@x.com' },
    ],
    canCreateTasks: access.canCreateTasks,
    canManageMembers: false,
  }),
  useProjectBoard: () => ({
    board: {
      id: 'b1',
      project_id: 'p1',
      name: 'Default',
      is_default: true,
      columns: [
        { id: 'c1', status: 'pending', order_index: 0, wip_limit: null },
        { id: 'c2', status: 'in-progress', order_index: 1, wip_limit: null },
        { id: 'c3', status: 'completed', order_index: 2, wip_limit: null },
      ],
    },
    tasks: [
      { id: 't1', title: 'Mine', status: 'pending', assigned_to: 'me', priority: 'low' },
      { id: 't2', title: 'Hers', status: 'in-progress', assigned_to: 'ana', priority: 'high' },
    ],
    taskLabelMap: {},
    isLoading: false,
    error: null,
  }),
  useProjectLabels: () => ({ data: [] }),
  useMoveTask: () => ({ mutate }),
  projectMembersQueryKey: (id: string) => ['project-members', id],
  taskLabelMapQueryKey: (id: string) => ['task-label-map', id],
}));

// The create modal is tested on its own: here, only what the page opens.
vi.mock('../components/modals/CreateTaskModal', () => ({
  default: (props: { isOpen: boolean; projectId?: string; defaultStatus?: string }) =>
    props.isOpen ? (
      <div data-testid="create-task">
        {props.projectId}:{props.defaultStatus}
      </div>
    ) : null,
}));
vi.mock('../components/modals/TaskDetailPanel', () => ({ default: () => null }));
vi.mock('../components/modals/EditProjectModal', () => ({ default: () => null }));

function renderAt(url: string) {
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  access.canCreateTasks = true;
  mutate.mockReset();
});

describe('ProjectPage', () => {
  it('shows the project and creates tasks inside it', () => {
    renderAt('/projects/p1');

    expect(screen.getByRole('heading', { name: 'Web' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '+ New task' }));

    expect(screen.getByTestId('create-task').textContent).toBe('p1:pending');
  });

  it('creates a task in the column it is added from', () => {
    renderAt('/projects/p1');

    fireEvent.click(screen.getByRole('button', { name: 'Add task to In Progress' }));

    expect(screen.getByTestId('create-task').textContent).toBe('p1:in-progress');
  });

  it('moves a task through the mutation', () => {
    renderAt('/projects/p1');

    const todo = screen.getByRole('region', { name: 'To Do' });
    fireEvent.click(within(todo).getByRole('button', { name: 'Start' }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'in-progress' }),
      expect.anything()
    );
  });

  it('lets viewers look but not create or move tasks', () => {
    access.canCreateTasks = false;
    renderAt('/projects/p1');

    expect(screen.queryByRole('button', { name: '+ New task' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Add task to/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
    expect(screen.getByText('Mine')).toBeTruthy();
  });

  it('switches to the list view and filters by member', () => {
    renderAt('/projects/p1?view=list');

    expect(screen.getByRole('tab', { name: 'List' }).getAttribute('aria-selected')).toBe(
      'true'
    );
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 tasks

    fireEvent.change(screen.getByLabelText('Member:'), { target: { value: 'ana' } });

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2);
    expect(within(rows[1]).getByText('Hers')).toBeTruthy();
  });
});
