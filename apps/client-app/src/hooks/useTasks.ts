import { useState, useEffect, useCallback } from 'react';
import { getTasksByProject } from '../services/taskService';
import { normalizeTask } from '../utils/status';
import type { components } from '@shared/api-types';

export type Task = components['schemas']['TaskResponseDto'];
export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];

export const useTasks = (projectId?: string) => {
  const initial = (() => {
    if (!projectId) return [] as Task[];
    try {
      const raw = localStorage.getItem(`tasks.cache.${projectId}`);
      return raw ? (JSON.parse(raw) as Task[]) : [];
    } catch {
      return [] as Task[];
    }
  })();
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!projectId) {
        return;
      }
    const items = await getTasksByProject(projectId);
    const list = Array.isArray(items) ? items.map((it) => normalizeTask(it)) : [];
      setTasks(list);
      try {
        localStorage.setItem(`tasks.cache.${projectId}`, JSON.stringify(list));
      } catch {}
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading tasks');      
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
  };
};
