import type { components } from '@shared/api-types';
import { axiosInstance } from './api';

type TaskResponse = components['schemas']['TaskResponseDto'];

/** Largest page the task search endpoint accepts. */
const SEARCH_PAGE_SIZE = 100;

export const getTasksByProject = async (
  projectId: string,
  opts?: { userId?: string; labelIds?: string[] }
) => {
  const params: Record<string, unknown> = {
    project_id: projectId,
  };

  if (opts?.userId) {
    params.assignee_ids = [opts.userId];
  }

  if (opts?.labelIds?.length) {
    params.label_ids = opts.labelIds;
  }

  const serialize = (payload: Record<string, unknown>) => {
    const pairs: string[] = [];
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          pairs.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(String(entry))}`
          );
        });
      } else {
        pairs.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        );
      }
    });
    return pairs.join('&');
  };

  // The search endpoint pages results (max 100 per request); fetch every
  // page so boards and lists are not silently cut off.
  const items: TaskResponse[] = [];
  for (;;) {
    const res = await axiosInstance.get('/tasks/search', {
      params: { ...params, limit: SEARCH_PAGE_SIZE, offset: items.length },
      paramsSerializer: { serialize } as never,
    });
    const page: TaskResponse[] = Array.isArray(res.data?.items)
      ? res.data.items
      : [];
    items.push(...page);
    const total = Number(res.data?.total ?? items.length);
    if (page.length === 0 || items.length >= total) return items;
  }
};

/** Tasks assigned to the current user across all projects (one request). */
export const getMyTasks = async (opts?: {
  statuses?: string[];
  limit?: number;
  offset?: number;
}): Promise<components['schemas']['TaskListResponseDto']> => {
  const res = await axiosInstance.get('/tasks/mine', {
    params: {
      statuses: opts?.statuses,
      limit: opts?.limit ?? 200,
      offset: opts?.offset ?? 0,
    },
    // Repeat array params (statuses=a&statuses=b) as the API expects.
    paramsSerializer: { indexes: null },
  });
  return res.data;
};

/** Per-project task totals for the current user's projects (one request). */
export const getTaskCounts = async (): Promise<
  Array<{ project_id: string; total: number; assigned_to_me: number }>
> => {
  const res = await axiosInstance.get('/tasks/counts');
  return Array.isArray(res.data) ? res.data : [];
};

export const createTask = async (
  data: components['schemas']['CreateTaskDto']
) => {
  const res = await axiosInstance.post('/tasks', data);
  return res.data;
};

export const updateTask = async (
  id: string,
  data: components['schemas']['UpdateTaskDto']
) => {
  const res = await axiosInstance.patch(`/tasks/${id}`, data);
  return res.data;
};

export const deleteTask = async (id: string) => {
  const res = await axiosInstance.delete(`/tasks/${id}`);
  return res.data;
};
