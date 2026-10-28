import type { components } from '@shared/api-types';
import { axiosInstance } from './api';

export type TaskComment = components['schemas']['TaskCommentResponseDto'];
export type TaskDetails = components['schemas']['TaskResponseDto'] & {
  project?: components['schemas']['ProjectResponseDto'];
  comments?: TaskComment[];
};

export const getTaskDetails = async (taskId: string): Promise<TaskDetails> => {
  const res = await axiosInstance.get(`/tasks/${taskId}/details`);
  return res.data;
};

export const createComment = async (
  data: components['schemas']['CreateTaskCommentDto']
): Promise<TaskComment> => {
  const res = await axiosInstance.post('/task-comments', data);
  return res.data;
};

export const deleteComment = async (commentId: string): Promise<void> => {
  await axiosInstance.delete(`/task-comments/${commentId}`);
};
