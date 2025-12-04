import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PROJECT_ROLES_KEY } from './project-roles.decorator';
import { RemoteAccessService } from '@libs/utils';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { UserRole } from '@shared/contracts';

@Injectable()
export class ProjectRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: RemoteAccessService
  ) {}

  private isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PROJECT_ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user: JwtPayload = req.user;
    if (!user) throw new ForbiddenException('Unauthorized');

    let projectId: string | null =
      req.params?.projectId ||
      req.params?.project_id ||
      req.body?.project_id ||
      req.query?.project_id ||
      null;

    if (!projectId) {
      const path: string = req.route?.path || '';
      const originalUrl: string = req.originalUrl || '';
      const method: string = req.method || 'GET';
      const params = req.params || {};

      if (path.includes('/tasks') && params['id']) {
        projectId = await this.access.resolveProjectId('task', params['id']);
      } else if (
        (path.startsWith('/projects') || originalUrl.includes('/projects/')) &&
        params['id']
      ) {
        projectId = params['id'];
      }
    }

    if (!projectId) throw new ForbiddenException('Project scope not resolved');

    if (!this.isValidUUID(projectId)) {
      throw new BadRequestException(`Invalid project_id format: ${projectId}`);
    }

    const isProjectRoute = (req.originalUrl || '').includes('/projects/');
    if (isProjectRoute && req.method === 'DELETE') {
      const exists = await this.access.resolveProjectId('project', projectId);
      if (!exists) {
        return true;
      }
    }

    try {
      if (user.role === UserRole.ADMIN) {
        return true;
      }

      const role = await this.access.getMemberRole(projectId, user.sub);

      if (!role && req.originalUrl?.includes('/tasks/search')) {
        let assigneeIds: string[] = [];

        if (req.query?.assignee_ids) {
          assigneeIds = Array.isArray(req.query.assignee_ids)
            ? req.query.assignee_ids
            : [req.query.assignee_ids];
        } else if (req.query?.['assignee_ids[]']) {
          assigneeIds = Array.isArray(req.query['assignee_ids[]'])
            ? req.query['assignee_ids[]']
            : [req.query['assignee_ids[]']];
        } else if (req.url) {
          try {
            const urlParts = req.url.split('?');
            if (urlParts.length > 1) {
              const urlParams = new URLSearchParams(urlParts[1]);
              const assigneeIdsArray = urlParams.getAll('assignee_ids[]');
              if (assigneeIdsArray.length > 0) {
                assigneeIds = assigneeIdsArray;
              } else {
                const singleParam = urlParams.get('assignee_ids');
                if (singleParam) {
                  assigneeIds = [singleParam];
                }
              }
            }
          } catch (e) {
            const urlMatch = req.url.match(/assignee_ids(?:\[\])?=([^&]+)/);
            if (urlMatch) {
              const decoded = decodeURIComponent(urlMatch[1]);
              assigneeIds = [decoded];
            }
          }
        }

        if (assigneeIds.length > 0 && assigneeIds.includes(user.sub)) {
          return true;
        }
      }

      if (!role) throw new ForbiddenException('Not a project member');

      if (!required.includes(role)) {
        throw new ForbiddenException('Insufficient project role');
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (
        error?.code === '22P02' ||
        error?.message?.includes('invalid input syntax for type uuid') ||
        error?.statusCode === 400
      ) {
        throw new BadRequestException(
          `Invalid project_id format: ${projectId}`
        );
      }
      throw error;
    }

    return true;
  }
}
