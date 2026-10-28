import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskHistoryResponseDto,
  TaskFilterDto,
  TaskListResponseDto,
  MyTasksQueryDto,
  ProjectTaskCountDto,
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

  async update(
    id: string,
    dto: UpdateTaskDto,
    actorId: string
  ): Promise<TaskResponseDto> {
    return firstValueFrom(
      this.taskTcpClient
        .getClient()
        .send({ cmd: 'task_update' }, { id, data: dto, actor_id: actorId })
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

  async findAssignedTo(
    userId: string,
    query: MyTasksQueryDto
  ): Promise<TaskListResponseDto> {
    return firstValueFrom(
      this.taskTcpClient
        .getClient()
        .send({ cmd: 'task_find_assigned' }, { user_id: userId, query })
    );
  }

  async countByProject(
    userId: string,
    allProjects: boolean
  ): Promise<ProjectTaskCountDto[]> {
    return firstValueFrom(
      this.taskTcpClient
        .getClient()
        .send(
          { cmd: 'task_count_by_project' },
          { user_id: userId, all_projects: allProjects }
        )
    );
  }

  async findFiltered(query: TaskFilterDto): Promise<TaskListResponseDto> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'task_find_filtered' }, query)
    );
  }
}
