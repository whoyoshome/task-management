import { Injectable, BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { firstValueFrom } from 'rxjs';
import { TaskTcpClient } from '../../../shared/clients';
import { RpcErrorPayload } from '../rpc/all-rpc-exceptions.filter';

const NOT_FOUND = 'The project_id provided does not exist.';

const statusOf = (error: unknown): number | undefined =>
  (error as Partial<RpcErrorPayload> | null)?.statusCode;

@Injectable()
export class RemoteProjectValidatorService {
  constructor(private readonly taskTcpClient: TaskTcpClient) {}

  async validateProjectExists(projectId: string): Promise<void> {
    if (!isUUID(projectId)) {
      throw new BadRequestException(`Invalid project_id format: ${projectId}`);
    }

    try {
      const project = await firstValueFrom(
        this.taskTcpClient
          .getClient()
          .send({ cmd: 'project_find_one' }, projectId)
      );
      if (!project) throw new BadRequestException(NOT_FOUND);
    } catch (error) {
      // Only "not found" means the project does not exist; timeouts and
      // connection errors keep their own status (504/503).
      const status = statusOf(error);
      if (status === 404 || status === 400) {
        throw new BadRequestException(NOT_FOUND);
      }
      throw error;
    }
  }
}
