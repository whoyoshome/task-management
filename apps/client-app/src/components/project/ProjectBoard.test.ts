import { describe, expect, it } from 'vitest';
import { dropTarget } from './ProjectBoard';
import type { Task } from '../../hooks';

const task = { id: 't1', status: 'pending' } as Task;

describe('dropTarget', () => {
  it('moves the task to the column it is dropped on', () => {
    expect(dropTarget(task, 'in-progress')).toBe('in-progress');
  });

  it('does nothing when dropped back on its own column', () => {
    expect(dropTarget(task, 'pending')).toBeNull();
  });

  it('does nothing when dropped outside a column', () => {
    expect(dropTarget(task, null)).toBeNull();
    expect(dropTarget(undefined, 'completed')).toBeNull();
  });
});
