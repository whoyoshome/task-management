import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from '@shared/contracts';

export const PROJECT_ROLES_KEY = 'project_roles';
export const ProjectRoles = (...roles: ProjectRole[]) =>
  SetMetadata(PROJECT_ROLES_KEY, roles);
