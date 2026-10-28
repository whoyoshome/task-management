import type { components } from '@shared/api-types';
import { axiosInstance } from './api';

type TaskStatus = components['schemas']['TaskResponseDto']['status'];

export type BoardColumn = {
  id: string;
  status: TaskStatus;
  order_index: number;
  wip_limit: number | null;
  /** Tasks of the project in this column, counted by the API. */
  task_count?: number;
  /** Soft WIP limit exceeded: shown as a warning, moves are not blocked. */
  over_wip_limit?: boolean;
};

export type Board = {
  id: string;
  project_id: string;
  name: string;
  is_default: boolean;
  columns: BoardColumn[];
};

type TaskResponse = components['schemas']['TaskResponseDto'];

export const getDefaultBoardForProject = async (
  projectId: string
): Promise<Board> => {
  const res = await axiosInstance.get(`/boards/project/${projectId}`);
  return res.data as Board;
};

export const moveTaskOnBoard = async (params: {
  task_id: string;
  board_id: string;
  status: TaskStatus;
}): Promise<TaskResponse> => {
  const res = await axiosInstance.patch<TaskResponse>(
    `/tasks/${params.task_id}`,
    { status: params.status }
  );
  return res.data;
};
