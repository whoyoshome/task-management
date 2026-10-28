import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectResponseDto,
} from '@shared/contracts';
import { TaskTcpClient } from '@shared/clients';
import { RemoteUserValidatorService } from '@libs/utils';

@Injectable()
export class ProjectService {
  constructor(
    private readonly taskTcpClient: TaskTcpClient,
    private readonly userValidator: RemoteUserValidatorService
  ) {}

  async create(dto: CreateProjectDto): Promise<ProjectResponseDto> {
    await this.userValidator.validateUserExists(dto.created_by, 'created_by');
    await this.userValidator.validateUserIsAdmin(dto.created_by);

    // Connection failures and timeouts are mapped to 503/504 by
    // AllExceptionsFilter.
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'project_create' }, dto)
    );
  }

  async findAll(
    userId: string,
    allProjects: boolean
  ): Promise<ProjectResponseDto[]> {
    return firstValueFrom(
      this.taskTcpClient
        .getClient()
        .send(
          { cmd: 'project_find_all' },
          { user_id: userId, all_projects: allProjects }
        )
    );
  }

  async findOne(id: string): Promise<ProjectResponseDto> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'project_find_one' }, id)
    );
  }

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectResponseDto> {
    return firstValueFrom(
      this.taskTcpClient
        .getClient()
        .send({ cmd: 'project_update' }, { id, data: dto })
    );
  }

  async remove(id: string): Promise<void> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'project_delete' }, id)
    );
  }

  async findOneWithMembers(id: string): Promise<ProjectResponseDto> {
    return firstValueFrom(
      this.taskTcpClient
        .getClient()
        .send({ cmd: 'project_find_one_with_members' }, id)
    );
  }
}
