import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CreateTaskModal from './CreateTaskModal';

const mutate = vi.fn();
const state = vi.hoisted(() => ({
  myRole: 'member' as 'admin' | 'member' | 'viewer',
  requestedProjectId: undefined as string | undefined,
}));

vi.mock('../../hooks', () => ({
  useAuth: () => ({ user: { id: 'me', role: 'user' } }),
  useProjects: () => ({
    projects: [
      { id: 'p1', name: 'Web' },
      { id: 'p2', name: 'Mobile' },
    ],
  }),
  useProjectMembers: (projectId?: string) => {
    state.requestedProjectId = projectId;
    const members = projectId
      ? [
          { user_id: 'me', role: state.myRole, full_name: 'Me', email: 'me@x.com' },
          { user_id: 'ana', role: 'member', full_name: 'Ana', email: 'ana@x.com' },
        ]
      : [];
    return {
      project: projectId ? { id: projectId, name: 'Web' } : undefined,
      members,
      isLoading: false,
      canCreateTasks: Boolean(projectId) && state.myRole !== 'viewer',
    };
  },
  useCreateTask: () => ({ mutate, isPending: false, error: null }),
}));

const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

beforeEach(() => {
  mutate.mockReset();
  state.myRole = 'member';
});

describe('CreateTaskModal', () => {
  it('inside a project: no project picker, members as assignees, me by default', () => {
    render(<CreateTaskModal isOpen onClose={vi.fn()} projectId="p1" />);

    expect(screen.queryByLabelText('Project')).toBeNull();
    expect(screen.getByText('In Web')).toBeTruthy();
    const assignee = screen.getByLabelText('Assignee') as HTMLSelectElement;
    expect(within(assignee).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Me (You)',
      'Ana',
    ]);
    expect(assignee.value).toBe('me');
  });

  it('creates a task for another member with only a title', () => {
    render(<CreateTaskModal isOpen onClose={vi.fn()} projectId="p1" />);

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: '  Write the docs  ' },
    });
    fireEvent.change(screen.getByLabelText('Assignee'), { target: { value: 'ana' } });
    submit();

    expect(mutate).toHaveBeenCalledWith(
      {
        project_id: 'p1',
        title: 'Write the docs',
        description: undefined,
        assigned_to: 'ana',
        status: 'pending',
        priority: 'medium',
        due_date: undefined,
      },
      expect.anything()
    );
  });

  it('starts in the status of the column it was opened from', () => {
    render(
      <CreateTaskModal isOpen onClose={vi.fn()} projectId="p1" defaultStatus="in-progress" />
    );

    expect((screen.getByLabelText('Status') as HTMLSelectElement).value).toBe(
      'in-progress'
    );
  });

  it('from anywhere: requires choosing the project first', () => {
    render(<CreateTaskModal isOpen onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Task' } });
    expect(
      (screen.getByRole('button', { name: 'Create Task' }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(state.requestedProjectId).toBeUndefined();

    fireEvent.change(screen.getByLabelText('Project'), { target: { value: 'p2' } });
    expect(state.requestedProjectId).toBe('p2');
    submit();

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ project_id: 'p2', assigned_to: 'me' }),
      expect.anything()
    );
  });

  it('does not offer statuses without a board column', () => {
    render(<CreateTaskModal isOpen onClose={vi.fn()} projectId="p1" />);

    const status = screen.getByLabelText('Status');
    expect(within(status).queryByRole('option', { name: 'Blocked' })).toBeNull();
  });

  it('explains why a viewer cannot create tasks', () => {
    state.myRole = 'viewer';
    render(<CreateTaskModal isOpen onClose={vi.fn()} projectId="p1" />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Task' } });

    expect(screen.getByText(/need member access/i)).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Create Task' }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it('closes with Escape', () => {
    const onClose = vi.fn();
    render(<CreateTaskModal isOpen onClose={onClose} projectId="p1" />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});
