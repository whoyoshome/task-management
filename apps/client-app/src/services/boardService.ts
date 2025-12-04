import { axiosInstance } from './api';
import type { components } from '@shared/api-types';

type TaskStatus = components['schemas']['TaskResponseDto']['status'];
type TaskResponse = components['schemas']['TaskResponseDto'];

export const getDefaultBoardForProject = async (projectId: string) => {
  const res = await axiosInstance.get(`/boards/project/${projectId}`);
  return res.data as {
    id: string;
    project_id: string;
    name: string;
    is_default: boolean;
    columns: {
      id: string;
      status: TaskStatus;
      order_index: number;
      wip_limit: number | null;
    }[];
  };
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
