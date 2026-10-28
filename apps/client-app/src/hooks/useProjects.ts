import { useQuery } from '@tanstack/react-query';
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

export const PROJECTS_QUERY_KEY = ['projects'] as const;

export const useProjects = () => {
  const query = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: getAllProjects,
  });

  return {
    projects: query.data ?? [],
    loading: query.isLoading,
    error: query.error
      ? (query.error as { response?: { data?: { message?: string } } })
          .response?.data?.message || 'Error loading projects'
      : null,
    refetch: query.refetch,
  };
};
