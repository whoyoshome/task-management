import { Injectable, BadRequestException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { TaskTcpClient } from '@shared/clients';

@Injectable()
export class RemoteTaskValidatorService {
  constructor(private readonly taskTcpClient: TaskTcpClient) {}

  async validateTaskExists(taskId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.taskTcpClient.getClient().send({ cmd: 'task_find_one' }, taskId)
      );
    } catch {
      throw new BadRequestException('The task_id provided does not exist.');
    }
  }
}
