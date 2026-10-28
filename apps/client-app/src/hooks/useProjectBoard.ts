import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDefaultBoardForProject,
  moveTaskOnBoard,
  type Board,
  type BoardColumn,
} from '../services/boardService';
import { listLabelIdsByTask } from '../services/labelService';
import { tasksQueryKey, useTasks, type Task } from './useTasks';
import { PROJECT_BOARD_QUERY_KEY, useInvalidateTasks } from './useMyTasks';

export const projectBoardQueryKey = (projectId?: string) =>
  [...PROJECT_BOARD_QUERY_KEY, projectId] as const;

export const taskLabelMapQueryKey = (projectId?: string) =>
  ['task-label-map', projectId] as const;

/** Keeps the API's per-column counts (and WIP flags) in sync after a move. */
export function moveColumnCount(board: Board, from: string, to: string): Board {
  const recount = (column: BoardColumn, delta: number): BoardColumn => {
    const taskCount = Math.max(0, (column.task_count ?? 0) + delta);
    return {
      ...column,
      task_count: taskCount,
      over_wip_limit: column.wip_limit != null && taskCount > column.wip_limit,
    };
  };
  return {
    ...board,
    columns: board.columns.map((column) => {
      if (from === to) return column;
      if (column.status === from) return recount(column, -1);
      if (column.status === to) return recount(column, 1);
      return column;
    }),
  };
}

/**
 * Everything the project page shows: the default board, every task of the
 * project and their labels. Two requests for tasks and labels in total,
 * whatever the number of tasks.
 */
export function useProjectBoard(projectId?: string) {
  const board = useQuery({
    queryKey: projectBoardQueryKey(projectId),
    queryFn: () => getDefaultBoardForProject(projectId!),
    enabled: Boolean(projectId),
  });
  const tasks = useTasks(projectId);
  const labels = useQuery({
    queryKey: taskLabelMapQueryKey(projectId),
    queryFn: () => listLabelIdsByTask(projectId!),
    enabled: Boolean(projectId),
  });

  return {
    board: board.data,
    tasks: tasks.tasks,
    taskLabelMap: labels.data ?? {},
    isLoading: board.isLoading || tasks.loading,
    error: board.error ?? tasks.error,
  };
}

/**
 * Moves a task to another column. The board and the list update at once and
 * are then reloaded with every other task view.
 */
export function useMoveTask(projectId?: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({
      task,
      board,
      status,
    }: {
      task: Task;
      board: Board;
      status: Task['status'];
    }) => moveTaskOnBoard({ task_id: task.id, board_id: board.id, status }),
    onMutate: ({ task, status }) => {
      queryClient.setQueryData<Task[]>(tasksQueryKey(projectId), (prev) =>
        prev?.map((t) => (t.id === task.id ? { ...t, status } : t))
      );
      queryClient.setQueryData<Board>(projectBoardQueryKey(projectId), (prev) =>
        prev ? moveColumnCount(prev, task.status, status) : prev
      );
    },
    onSettled: invalidate,
  });
}
