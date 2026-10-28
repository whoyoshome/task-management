import { useQuery } from '@tanstack/react-query';
import { getTasksByProject } from '../services/taskService';
import { normalizeTask } from '../utils/status';
import type { components } from '@shared/api-types';

export type Task = components['schemas']['TaskResponseDto'];
export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];

export const tasksQueryKey = (projectId?: string) =>
  ['tasks', projectId] as const;

export const useTasks = (projectId?: string) => {
  const query = useQuery({
    queryKey: tasksQueryKey(projectId),
    queryFn: async () => {
      if (!projectId) {
        return [] as Task[];
      }
      const items = await getTasksByProject(projectId);
      return Array.isArray(items) ? items.map((item) => normalizeTask(item)) : [];
    },
    enabled: Boolean(projectId),
  });

  return {
    tasks: query.data ?? [],
    loading: query.isLoading,
    error: query.error
      ? (query.error as { response?: { data?: { message?: string } } })
          .response?.data?.message || 'Error loading tasks'
      : null,
    refetch: query.refetch,
  };
};
