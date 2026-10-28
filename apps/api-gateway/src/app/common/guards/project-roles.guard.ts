import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import { PROJECT_ROLES_KEY } from './project-roles.decorator';
import {
  PROJECT_SCOPE_KEY,
  ProjectScopeOptions,
  ScopeRef,
} from './project-scope.decorator';
import { RemoteAccessService } from '@libs/utils';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { UserRole } from '@shared/contracts';

type ScopedRequest = {
  user?: JwtPayload;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  route?: { path?: string };
};

/**
 * Checks the caller's role in the project a route acts on. The project comes
 * only from the route's @ProjectScope (the referenced resource); a route with
 * @ProjectRoles but no @ProjectScope is rejected rather than guessed.
 */
@Injectable()
export class ProjectRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: RemoteAccessService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const required = this.reflector.getAllAndOverride<string[]>(
      PROJECT_ROLES_KEY,
      targets
    );
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<ScopedRequest>();
    const user = req.user;
    if (!user) throw new ForbiddenException('Unauthorized');

    const scope = this.reflector.getAllAndOverride<ProjectScopeOptions>(
      PROJECT_SCOPE_KEY,
      targets
    );
    if (!scope) {
      // Fail closed: a missing declaration must never grant access.
      throw new InternalServerErrorException(
        `Route ${req.route?.path ?? ''} has @ProjectRoles but no @ProjectScope`
      );
    }

    const projectId = await this.resolve(req, scope);

    for (const ref of scope.also ?? []) {
      if ((await this.resolve(req, ref)) !== projectId) {
        throw new BadRequestException(
          `${ref.key} belongs to a different project`
        );
      }
    }

    // A project_id sent by the client cannot point somewhere else than the
    // resource the route acts on.
    for (const supplied of [req.body?.project_id, req.query?.project_id]) {
      if (supplied !== undefined && supplied !== projectId) {
        throw new ForbiddenException('project_id does not match the resource');
      }
    }

    if (user.role === UserRole.ADMIN) return true;

    const role = await this.access.getMemberRole(projectId, user.sub);
    if (
      !role &&
      scope.allowOwnAssignedTasks &&
      this.searchesOnlyOwnTasks(req, user)
    ) {
      return true;
    }
    if (!role) throw new ForbiddenException('Not a project member');
    if (!required.includes(role)) {
      throw new ForbiddenException('Insufficient project role');
    }
    return true;
  }

  /** Project of the resource referenced by `ref`; 400/404 when invalid. */
  private async resolve(req: ScopedRequest, ref: ScopeRef): Promise<string> {
    const source = ref.in === 'param' ? req.params : req[ref.in];
    const id = source?.[ref.key];

    if (typeof id !== 'string' || !isUUID(id)) {
      throw new BadRequestException(`Invalid ${ref.key}`);
    }

    const projectId = await this.access.resolveProjectId(ref.resource, id);
    if (!projectId) {
      throw new NotFoundException(`${ref.resource.replace('_', ' ')} not found`);
    }
    return projectId;
  }

  /**
   * Non-members may search a project only for tasks assigned to themselves.
   * Reads assignee_ids exactly as TaskFilterDto does: any other spelling
   * (e.g. "assignee_ids[]") is dropped by validation, which would turn the
   * search into an unfiltered one.
   */
  private searchesOnlyOwnTasks(req: ScopedRequest, user: JwtPayload): boolean {
    const raw = req.query?.assignee_ids;
    const ids = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
    return ids.length > 0 && ids.every((id) => id === user.sub);
  }
}
