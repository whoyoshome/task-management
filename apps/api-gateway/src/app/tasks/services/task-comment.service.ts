import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  CreateTaskCommentDto,
  TaskCommentResponseDto,
} from '@shared/contracts';
import { TaskTcpClient } from '@shared/clients';
import { RemoteUserValidatorService, RemoteTaskValidatorService } from '@libs/utils';

@Injectable()
export class TaskCommentService {
  constructor(
    private readonly taskTcpClient: TaskTcpClient,
    private readonly userValidator: RemoteUserValidatorService,
    private readonly taskValidator: RemoteTaskValidatorService
  ) {}

  async create(dto: CreateTaskCommentDto): Promise<TaskCommentResponseDto> {
    await this.taskValidator.validateTaskExists(dto.task_id);
    await this.userValidator.validateUserExists(dto.user_id, 'user_id');
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'comment_create' }, dto)
    );
  }

  async remove(id: string): Promise<void> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'comment_delete' }, id)
    );
  }
}
