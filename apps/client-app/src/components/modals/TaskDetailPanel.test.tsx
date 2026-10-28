import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskDetailPanel from './TaskDetailPanel';
import type { Task } from '../../hooks/useTasks';

vi.mock('../../hooks/useTaskDetails', () => ({
  useTaskDetails: () => ({
    data: {
      comments: [
        {
          id: 'comment-1',
          task_id: 'task-1',
          user_id: 'user-1',
          content: 'Looks good',
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
    isLoading: false,
  }),
  useTaskLabels: () => ({ data: [] }),
  useProjectLabels: () => ({
    data: [
      {
        id: 'label-1',
        name: 'Bug',
        color: '#ff0000',
        project_id: 'p1',
        created_at: '',
        updated_at: '',
      },
    ],
  }),
  useTaskCommentMutations: () => ({
    create: { mutateAsync: vi.fn(), isPending: false },
    remove: { mutateAsync: vi.fn() },
  }),
  useTaskLabelMutations: () => ({
    assign: { mutateAsync: vi.fn() },
    remove: { mutateAsync: vi.fn() },
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'admin@example.com',
      full_name: 'Admin',
      role: 'admin',
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
  }),
}));

const task: Task = {
  id: 'task-1',
  number: 1,
  title: 'Fix login bug',
  description: 'Investigate auth issue',
  status: 'pending',
  priority: 'high',
  due_date: '',
  created_by: 'user-1',
  assigned_to: 'user-1',
  project_id: 'project-1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('TaskDetailPanel', () => {
  it('renders task details and comments', () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetailPanel
          task={task}
          users={[
            { id: 'user-1', email: 'admin@example.com', full_name: 'Admin' },
          ]}
          isOpen
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Fix login bug')).toBeTruthy();
    expect(screen.getByText('Looks good')).toBeTruthy();
    expect(screen.getByText('Bug')).toBeTruthy();
  });
});
