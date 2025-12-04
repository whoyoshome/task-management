import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { TaskTcpClient } from '@shared/clients';

@Injectable()
export class RemoteAccessService {
  constructor(private readonly taskTcpClient: TaskTcpClient) {}

  async getMemberRole(project_id: string, user_id: string): Promise<string | null> {
    return firstValueFrom(
      this.taskTcpClient
        .getClient()
        .send({ cmd: 'project_member_get_role' }, { project_id, user_id })
    );
  }

  async resolveProjectId(resource: string, id: string): Promise<string | null> {
    return firstValueFrom(
      this.taskTcpClient
        .getClient()
        .send({ cmd: 'access_resolve_project' }, { resource, id })
    );
  }
}
