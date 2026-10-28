import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyTaskCard from './MyTaskCard';
import type { Task } from '../../hooks/useTasks';

const task = (status: Task['status']) =>
  ({
    id: 'abc123',
    number: 12,
    title: 'Write tests',
    description: 'For the card',
    status,
    priority: 'high',
    project_id: 'p1',
    assigned_to: 'u1',
  }) as Task;

const renderCard = (status: Task['status']) => {
  const handlers = {
    onOpen: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onChangeStatus: vi.fn(),
  };
  render(
    <MemoryRouter>
      <MyTaskCard task={task(status)} projectId="p1" projectKey="WEB" assigneeName="Ana" busy={false} {...handlers} />
    </MemoryRouter>
  );
  return handlers;
};

describe('MyTaskCard', () => {
  it('offers the transitions of each status', () => {
    const { onChangeStatus } = renderCard('in-progress');

    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onChangeStatus.mock.calls).toEqual([['completed'], ['pending']]);
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
  });

  it('does not open the task when an action button is clicked', () => {
    const { onOpen, onDelete } = renderCard('pending');

    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }));

    expect(onDelete).toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('shows the task key, assignee and priority', () => {
    renderCard('completed');

    expect(screen.getByText('WEB-12')).toBeTruthy();
    expect(screen.getByText('Assigned to: Ana')).toBeTruthy();
    expect(screen.getByText('Priority: High')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reopen' })).toBeTruthy();
  });
});
