import { SetMetadata } from '@nestjs/common';

/** Resources whose project the task-microservice can resolve. */
export type ScopedResource =
  | 'project'
  | 'task'
  | 'board'
  | 'board_column'
  | 'sprint'
  | 'label'
  | 'project_member'
  | 'task_comment'
  | 'task_dependency';

/** Where a request carries the id of a resource, and which resource it is. */
export interface ScopeRef {
  resource: ScopedResource;
  in: 'param' | 'body' | 'query';
  key: string;
}

export interface ProjectScopeOptions extends ScopeRef {
  /** Other resources in the request that must belong to the same project. */
  also?: ScopeRef[];
  /**
   * Let non-members through when every `assignee_ids` query value is the
   * caller (task search limited to their own tasks).
   */
  allowOwnAssignedTasks?: boolean;
}

export const PROJECT_SCOPE_KEY = 'project_scope';

/**
 * Declares which project a route acts on, for ProjectRolesGuard. The project
 * is always derived from the referenced resource (a project id is resolved
 * too, so it must exist); client-supplied project_id fields cannot widen it.
 *
 * @example @ProjectScope({ resource: 'task', in: 'param', key: 'id' })
 */
export const ProjectScope = (options: ProjectScopeOptions) =>
  SetMetadata(PROJECT_SCOPE_KEY, options);
