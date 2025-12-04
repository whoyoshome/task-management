import type { components } from '@shared/api-types';
import { axiosInstance } from './api';

export const getTasksByProject = async (projectId: string, userId?: string) => {
  const params: Record<string, any> = {
    project_id: projectId,
    _t: Date.now(),
  };

  if (userId) {
    params.assignee_ids = [userId];
  }

  const res = await axiosInstance.get('/tasks/search', {
    params, 
  });

  return Array.isArray(res.data?.items) ? res.data.items : [];
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

export const getMyTasksByProject = async (
  projectId: string,
  userId: string,
  opts?: { statuses?: string[]; limit?: number; offset?: number }
) => {
  const params: Record<string, any> = {
    project_id: projectId,
    assignee_ids: [userId],
    limit: opts?.limit ?? 50,
    offset: opts?.offset ?? 0,
  };
  if (opts?.statuses && opts.statuses.length > 0) {
    params.statuses = opts.statuses;
  }

  const serialize = (p: Record<string, any>) => {
    const pairs: string[] = [];
    Object.entries(p).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => {
          pairs.push(
            `${encodeURIComponent(key + '[]')}=${encodeURIComponent(String(v))}`
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

  const res = await axiosInstance.get('/tasks/search', {
    params,
    paramsSerializer: { serialize } as any,
  });
  return Array.isArray(res.data?.items) ? res.data.items : [];
};
