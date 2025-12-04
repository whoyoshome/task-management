import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TaskService } from '../../tasks/services/task.service';
import { RemoteAccessService } from '@libs/utils';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class TaskModifyGuard implements CanActivate {
  constructor(
    private readonly taskService: TaskService,
    private readonly access: RemoteAccessService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user: JwtPayload = req.user;
    const id: string | undefined = req.params?.id;

    if (!user || !id) throw new ForbiddenException('Unauthorized');

    const task = await this.taskService.findOne(id);

    if (!task) throw new ForbiddenException('Task not found');

    if (task.assigned_to === user.sub) return true;

    const projectId = task.project_id;

    if (!projectId) throw new ForbiddenException('Project scope not resolved');

    const role = await this.access.getMemberRole(projectId, user.sub);

    if (role === 'admin') return true;

    throw new ForbiddenException('Insufficient permissions to modify task');
  }
}
