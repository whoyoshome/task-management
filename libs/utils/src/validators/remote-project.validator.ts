import { Injectable, BadRequestException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { TaskTcpClient } from '@shared/clients';

@Injectable()
export class RemoteProjectValidatorService {
  constructor(private readonly taskTcpClient: TaskTcpClient) {}

  private isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  async validateProjectExists(projectId: string): Promise<void> {
    if (!this.isValidUUID(projectId)) {
      throw new BadRequestException(`Invalid project_id format: ${projectId}`);
    }

    try {
      const result = await firstValueFrom(
        this.taskTcpClient
          .getClient()
          .send({ cmd: 'project_find_one' }, projectId)
      );

      if (!result) {
        throw new BadRequestException(
          'The project_id provided does not exist.'
        );
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error?.statusCode === 400 || error?.error?.statusCode === 400) {
        throw new BadRequestException(
          error?.message || 'The project_id provided does not exist.'
        );
      }

      if (error?.statusCode === 404 || error?.error?.statusCode === 404) {
        throw new BadRequestException(
          'The project_id provided does not exist.'
        );
      }

      if (
        error?.code === '22P02' ||
        error?.message?.includes('invalid input syntax for type uuid')
      ) {
        throw new BadRequestException(
          `Invalid project_id format: ${projectId}`
        );
      }

      throw new BadRequestException('The project_id provided does not exist.');
    }
  }
}
