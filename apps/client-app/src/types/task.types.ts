import type { components } from '@shared/api-types';

export type TaskStatus = components['schemas']['TaskResponseDto']['status'];
export type TaskPriority = components['schemas']['TaskResponseDto']['priority'];
export type CreateTask = components['schemas']['CreateTaskDto'];
export type UpdateTask = components['schemas']['UpdateTaskDto'];
export type TaskResponse = components['schemas']['TaskResponseDto'];

export const TASK_STATUSES: readonly TaskStatus[] = [
  'pending',
  'in-progress',
  'completed',
  'blocked',
] as const;

export const TASK_PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high'] as const;
