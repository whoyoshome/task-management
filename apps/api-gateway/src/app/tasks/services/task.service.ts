import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskHistoryResponseDto,
  TaskFilterDto,
  TaskListResponseDto,
  TaskDetailsResponseDto,
} from '@shared/contracts';
import { TaskTcpClient } from '@shared/clients';
import {
  RemoteUserValidatorService,
  RemoteProjectValidatorService,
} from '@libs/utils';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskTcpClient: TaskTcpClient,
    private readonly userValidator: RemoteUserValidatorService,
    private readonly projectValidator: RemoteProjectValidatorService
  ) {}

  async create(dto: CreateTaskDto): Promise<TaskResponseDto> {
    await this.userValidator.validateUserExists(dto.created_by, 'created_by');
    await this.userValidator.validateUserExists(dto.assigned_to, 'assigned_to');
    await this.projectValidator.validateProjectExists(dto.project_id);

    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'task_create' }, dto)
    );
  }

  async findAll(): Promise<TaskResponseDto[]> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'task_find_all' }, {})
    );
  }

  async findOne(id: string): Promise<TaskResponseDto> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'task_find_one' }, id)
    );
  }

  async update(id: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    return firstValueFrom(
      this.taskTcpClient
        .getClient()
        .send({ cmd: 'task_update' }, { id, data: dto })
    );
  }

  async remove(id: string): Promise<void> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'task_delete' }, id)
    );
  }

  async findOneWithDetails(id: string): Promise<TaskDetailsResponseDto> {
    return firstValueFrom(
      this.taskTcpClient
        .getClient()
        .send({ cmd: 'task_find_one_with_details' }, id)
    );
  }

  async getHistory(id: string): Promise<TaskHistoryResponseDto[]> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'task_history_list' }, id)
    );
  }

  async findFiltered(query: TaskFilterDto): Promise<TaskListResponseDto> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'task_find_filtered' }, query)
    );
  }
}
