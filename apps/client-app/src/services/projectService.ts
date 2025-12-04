import { axiosInstance } from './api';
import type { components } from '@shared/api-types';

type CreateProjectDto = components['schemas']['CreateProjectDto'];
type UpdateProjectDto = components['schemas']['UpdateProjectDto'];
type ProjectResponse = components['schemas']['ProjectResponseDto'];

export const getAllProjects = async (): Promise<ProjectResponse[]> => {
  const response = await axiosInstance.get<ProjectResponse[]>('/projects');
  return response.data;
};

export const createProject = async (
  project: CreateProjectDto
): Promise<ProjectResponse> => {
  localStorage.getItem('access_token');
  const response = await axiosInstance.post<ProjectResponse>(
    '/projects',
    project
  );

  return response.data;
};

export const updateProject = async (
  id: string,
  project: UpdateProjectDto
): Promise<ProjectResponse> => {
  const response = await axiosInstance.patch<ProjectResponse>(
    `/projects/${id}`,
    project
  );
  return response.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  const response = await axiosInstance.delete(`/projects/${id}`);
  return response.data;
};

export const getProjectWithMembers = async (id: string) => {
  const response = await axiosInstance.get(`/projects/${id}/members`);
  return response.data;
};
