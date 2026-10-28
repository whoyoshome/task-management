import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createComment,
  deleteComment,
  getTaskDetails,
  type TaskDetails,
} from '../services/commentService';
import {
  assignLabelToTask,
  listLabelsByProject,
  listLabelsByTask,
  removeLabelFromTask,
  type Label,
} from '../services/labelService';
import { tasksQueryKey } from './useTasks';

export const taskDetailsQueryKey = (taskId?: string) =>
  ['task-details', taskId] as const;

export const projectLabelsQueryKey = (projectId?: string) =>
  ['project-labels', projectId] as const;

export const taskLabelsQueryKey = (taskId?: string) =>
  ['task-labels', taskId] as const;

export function useTaskDetails(taskId?: string) {
  return useQuery({
    queryKey: taskDetailsQueryKey(taskId),
    queryFn: () => getTaskDetails(taskId!),
    enabled: Boolean(taskId),
  });
}

export function useProjectLabels(projectId?: string) {
  return useQuery({
    queryKey: projectLabelsQueryKey(projectId),
    queryFn: () => listLabelsByProject(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useTaskLabels(taskId?: string) {
  return useQuery({
    queryKey: taskLabelsQueryKey(taskId),
    queryFn: () => listLabelsByTask(taskId!),
    enabled: Boolean(taskId),
  });
}

export function useTaskCommentMutations(taskId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (taskId) {
      queryClient.invalidateQueries({ queryKey: taskDetailsQueryKey(taskId) });
    }
  };

  const create = useMutation({
    mutationFn: createComment,
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteComment,
    onSuccess: invalidate,
  });

  return { create, remove };
}

export function useTaskLabelMutations(taskId?: string, projectId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (taskId) {
      queryClient.invalidateQueries({ queryKey: taskLabelsQueryKey(taskId) });
      queryClient.invalidateQueries({ queryKey: taskDetailsQueryKey(taskId) });
    }
    if (projectId) {
      queryClient.invalidateQueries({
        queryKey: projectLabelsQueryKey(projectId),
      });
      queryClient.invalidateQueries({ queryKey: tasksQueryKey(projectId) });
    }
  };

  const assign = useMutation({
    mutationFn: ({ labelId }: { labelId: string }) =>
      assignLabelToTask(taskId!, labelId),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: ({ labelId }: { labelId: string }) =>
      removeLabelFromTask(taskId!, labelId),
    onSuccess: invalidate,
  });

  return { assign, remove };
}

export type { TaskDetails, Label };
