import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllProjects } from '../services/projectService';

export interface Project {
  id: string;
  name: string;
  description?: string;
  key?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export const useProjects = () => {  
  const cached = (() => {
    try {
      const raw = localStorage.getItem('projects.cache');
      return raw ? (JSON.parse(raw) as Project[]) : [];
    } catch {
      return [] as Project[];
    }
  })();
  const [projects, setProjects] = useState<Project[]>(cached);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const fetchProjects = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await getAllProjects();
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
      try {
        localStorage.setItem('projects.cache', JSON.stringify(list));
      } catch {}
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading projects');
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
};
