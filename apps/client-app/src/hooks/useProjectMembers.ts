import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjectWithMembers } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { useUsers } from './useUsers';
import type { Project } from './useProjects';

export type ProjectRole = 'admin' | 'member' | 'viewer';

export interface ProjectMember {
  user_id: string;
  role: ProjectRole;
  full_name: string;
  email: string;
}

export const projectMembersQueryKey = (projectId?: string) =>
  ['project-members', projectId] as const;

/**
 * A project with its members (names resolved from the user list) and what
 * the current user may do in it. Global admins pass every project check in
 * the API, so they get every permission here too.
 */
export function useProjectMembers(projectId?: string) {
  const { user } = useAuth();
  const { users } = useUsers();
  const query = useQuery({
    queryKey: projectMembersQueryKey(projectId),
    queryFn: () =>
      getProjectWithMembers(projectId!) as Promise<
        Project & { members?: { user_id: string; role: ProjectRole }[] }
      >,
    enabled: Boolean(projectId),
  });

  const members = useMemo<ProjectMember[]>(
    () =>
      (query.data?.members ?? []).map((member) => {
        const account = users.find((u) => u.id === member.user_id);
        return {
          user_id: member.user_id,
          role: member.role,
          full_name: account?.full_name ?? '',
          email: account?.email ?? '',
        };
      }),
    [query.data, users]
  );

  const isGlobalAdmin = user?.role === 'admin';
  const myRole = members.find((m) => m.user_id === user?.id)?.role;

  return {
    project: query.data,
    members,
    isLoading: query.isLoading,
    error: query.error,
    myRole,
    // POST /tasks needs a member or admin project role.
    canCreateTasks: isGlobalAdmin || myRole === 'admin' || myRole === 'member',
    // POST /project-members is limited to global admins.
    canManageMembers: isGlobalAdmin,
  };
}
