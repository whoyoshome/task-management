import type { components } from '@shared/api-types';
import { axiosInstance } from './api';

export type Label = components['schemas']['LabelResponseDto'];

export type UpdateLabelPayload = {
  name?: string;
  color?: string | null;
};

export const listLabelsByProject = async (
  projectId: string
): Promise<Label[]> => {
  const res = await axiosInstance.get(`/labels/projects/${projectId}`);
  return Array.isArray(res.data) ? res.data : [];
};

/** Label ids per task for a whole project, in a single request. */
export const listLabelIdsByTask = async (
  projectId: string
): Promise<Record<string, string[]>> => {
  const res = await axiosInstance.get(
    `/labels/projects/${projectId}/assignments`
  );
  const byTask: Record<string, string[]> = {};
  for (const { task_id, label_id } of Array.isArray(res.data) ? res.data : []) {
    (byTask[task_id] ??= []).push(label_id);
  }
  return byTask;
};

export const listLabelsByTask = async (taskId: string): Promise<Label[]> => {
  const res = await axiosInstance.get(`/labels/tasks/${taskId}`);
  return Array.isArray(res.data) ? res.data : [];
};

export const createLabel = async (
  data: components['schemas']['CreateLabelDto']
): Promise<Label> => {
  const res = await axiosInstance.post('/labels', data);
  return res.data;
};

export const updateLabel = async (
  labelId: string,
  data: UpdateLabelPayload
): Promise<Label> => {
  const res = await axiosInstance.patch(`/labels/${labelId}`, data);
  return res.data;
};

export const deleteLabel = async (labelId: string): Promise<void> => {
  await axiosInstance.delete(`/labels/${labelId}`);
};

export const assignLabelToTask = async (
  taskId: string,
  labelId: string
): Promise<void> => {
  await axiosInstance.post(`/labels/tasks/${taskId}/${labelId}`);
};

export const removeLabelFromTask = async (
  taskId: string,
  labelId: string
): Promise<void> => {
  await axiosInstance.delete(`/labels/tasks/${taskId}/${labelId}`);
};
