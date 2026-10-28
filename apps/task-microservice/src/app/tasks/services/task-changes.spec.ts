import { TaskPriority, TaskStatus } from '@shared/contracts';
import { Task } from '../entities';
import { changeMetadata, describeChange, diffTask } from './task-changes';

describe('task-changes', () => {
  const task = {
    title: 'Fix login',
    description: 'Old text',
    status: TaskStatus.PENDING,
    priority: TaskPriority.LOW,
    due_date: '2026-11-01',
    assigned_to: 'user-1',
  } as unknown as Task;

  describe('diffTask', () => {
    it('ignores fields that are absent or unchanged', () => {
      expect(diffTask(task, {})).toEqual([]);
      expect(
        diffTask(task, { title: 'Fix login', status: TaskStatus.PENDING })
      ).toEqual([]);
    });

    it('compares due dates by calendar day', () => {
      expect(
        diffTask(task, { due_date: '2026-11-01T00:00:00.000Z' })
      ).toEqual([]);
      expect(diffTask(task, { due_date: '2026-11-02' })).toEqual([
        { field: 'due_date', from: '2026-11-01', to: '2026-11-02' },
      ]);
    });

    it('reports changes in a stable field order', () => {
      const fields = diffTask(task, {
        assigned_to: 'user-2',
        title: 'Fix login flow',
        priority: TaskPriority.HIGH,
      }).map((c) => c.field);

      expect(fields).toEqual(['title', 'priority', 'assigned_to']);
    });
  });

  describe('describeChange', () => {
    it('describes set, cleared and changed values', () => {
      expect(
        describeChange({ field: 'due_date', from: null, to: '2026-12-01' })
      ).toBe('Set due date to "2026-12-01"');
      expect(
        describeChange({ field: 'due_date', from: '2026-12-01', to: null })
      ).toBe('Cleared due date (was "2026-12-01")');
      expect(
        describeChange({ field: 'assigned_to', from: 'user-1', to: 'user-2' })
      ).toBe('Changed assignee from "user-1" to "user-2"');
    });

    it('does not copy description text into the history', () => {
      const change = { field: 'description' as const, from: 'a', to: 'b' };

      expect(describeChange(change)).toBe('Updated the description');
      expect(changeMetadata(change)).toEqual({ field: 'description' });
    });
  });
});
