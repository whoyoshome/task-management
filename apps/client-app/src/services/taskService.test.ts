import { afterEach, describe, expect, it } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import { axiosInstance } from './api';
import { getTasksByProject } from './taskService';
import { listLabelIdsByTask } from './labelService';

// Route requests through a fake adapter and record them.
function mockServer(handler: (config: InternalAxiosRequestConfig) => unknown) {
  const calls: InternalAxiosRequestConfig[] = [];
  axiosInstance.defaults.adapter = async (config) => {
    calls.push(config);
    return { data: handler(config), status: 200, statusText: '', headers: {}, config };
  };
  return calls;
}

const tasks = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: `task-${from + i}` }));

describe('getTasksByProject', () => {
  afterEach(() => localStorage.clear());

  it('fetches every page instead of stopping at the first one', async () => {
    const calls = mockServer((config) => {
      const offset = Number(config.params.offset);
      return { items: tasks(offset, Math.min(100, 230 - offset)), total: 230 };
    });

    const result = await getTasksByProject('project-1');

    expect(result).toHaveLength(230);
    expect(calls.map((c) => c.params.offset)).toEqual([0, 100, 200]);
    expect(calls.every((c) => c.params.limit === 100)).toBe(true);
  });

  it('makes a single request when everything fits in one page', async () => {
    const calls = mockServer(() => ({ items: tasks(0, 3), total: 3 }));

    expect(await getTasksByProject('project-1')).toHaveLength(3);
    expect(calls).toHaveLength(1);
  });
});

describe('listLabelIdsByTask', () => {
  it('groups the project label assignments by task', async () => {
    const calls = mockServer(() => [
      { task_id: 't1', label_id: 'bug' },
      { task_id: 't1', label_id: 'ui' },
      { task_id: 't2', label_id: 'bug' },
    ]);

    expect(await listLabelIdsByTask('project-1')).toEqual({
      t1: ['bug', 'ui'],
      t2: ['bug'],
    });
    expect(calls[0].url).toBe('/labels/projects/project-1/assignments');
  });
});
