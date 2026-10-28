import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteTask,
  getMyTasks,
  getTaskCounts,
  updateTask,
} from '../services/taskService';
import { normalizeTask } from '../utils/status';
import type { Task, TaskStatus } from './useTasks';

export const MY_TASKS_QUERY_KEY = ['my-tasks'] as const;
export const TASK_COUNTS_QUERY_KEY = ['task-counts'] as const;
// Prefix of every per-project task list (see tasksQueryKey).
const PROJECT_TASKS_QUERY_KEY = ['tasks'] as const;

/** Tasks assigned to the current user across all projects. */
export function useMyTasks() {
  return useQuery({
    queryKey: MY_TASKS_QUERY_KEY,
    queryFn: async (): Promise<Task[]> => {
      const page = await getMyTasks();
      return (page.items ?? []).map((task) => normalizeTask(task) as Task);
    },
  });
}

/** Task totals per project, keyed by project id. */
export function useTaskCounts() {
  return useQuery({
    queryKey: TASK_COUNTS_QUERY_KEY,
    queryFn: async () => {
      const counts = await getTaskCounts();
      return Object.fromEntries(counts.map((c) => [c.project_id, c]));
    },
  });
}

/** Refreshes every task list, count and dashboard after a task changes. */
export function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: MY_TASKS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: TASK_COUNTS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: PROJECT_TASKS_QUERY_KEY }),
    ]);
}

export function useUpdateTaskStatus() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTask(id, { status }),
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: invalidate,
  });
}
