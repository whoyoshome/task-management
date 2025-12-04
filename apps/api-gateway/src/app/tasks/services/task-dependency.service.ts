import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CreateTaskDependencyDto, TaskDependencyResponseDto } from '@shared/contracts';
import { TaskTcpClient } from '@shared/clients';

@Injectable()
export class TaskDependencyService {
  constructor(private readonly taskTcpClient: TaskTcpClient) {}

  async create(
    dto: CreateTaskDependencyDto
  ): Promise<TaskDependencyResponseDto> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'dependency_create' }, dto)
    );
  }

  async remove(id: string): Promise<void> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'dependency_delete' }, id)
    );
  }
}
