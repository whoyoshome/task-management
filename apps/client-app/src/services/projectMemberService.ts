import { axiosInstance } from './api';

export const addProjectMember = async (dto: { project_id: string; user_id: string; role: 'viewer' | 'member' | 'admin' }) => {
  const res = await axiosInstance.post('/project-members', dto);
  return res.data;
};

export const removeProjectMember = async (memberId: string) => {
  const res = await axiosInstance.delete(`/project-members/${memberId}`);
  return res.data;
};
