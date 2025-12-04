import type { components } from '@shared/api-types';

type TaskStatus = components['schemas']['TaskResponseDto']['status'];
type TaskPriority = components['schemas']['TaskResponseDto']['priority'];

export function normalizeTaskStatus(value: any): TaskStatus {
  const v = String(value ?? '').toLowerCase();
  if (v === 'in-progress' || v === 'in_progress' || v === 'in progress' || v === 'inprogress' || v === 'in-progress ') {
    return 'in-progress';
  }
  if (v === 'completed' || v === 'complete' || v === 'done') {
    return 'completed';
  }
  if (v === 'blocked') {
    return 'blocked';
  }
  return 'pending';
}

export function normalizeTaskPriority(value: any): TaskPriority | undefined {
  if (value == null) return undefined;
  const v = String(value).toLowerCase();
  if (v === 'high') return 'high';
  if (v === 'medium') return 'medium';
  if (v === 'low') return 'low';
  return undefined;
}

export function normalizeTask<T extends { status?: any; priority?: any }>(task: T) {
  return {
    ...task,
    status: normalizeTaskStatus(task.status),
    priority: normalizeTaskPriority(task.priority),
  } as T & { status: TaskStatus; priority?: TaskPriority };
}
