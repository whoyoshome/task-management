import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  CreateProjectMemberDto,
  ProjectMemberResponseDto,
} from '@shared/contracts';
import { TaskTcpClient } from '@shared/clients';
import {
  RemoteUserValidatorService,
  RemoteProjectValidatorService,
} from '@libs/utils';

@Injectable()
export class ProjectMemberService {
  constructor(
    private readonly taskTcpClient: TaskTcpClient,
    private readonly remoteUserValidator: RemoteUserValidatorService,
    private readonly remoteProjectValidator: RemoteProjectValidatorService
  ) {}

  async add(dto: CreateProjectMemberDto): Promise<ProjectMemberResponseDto> {
    await this.remoteUserValidator.validateUserExists(dto.user_id, 'user_id');
    await this.remoteProjectValidator.validateProjectExists(dto.project_id);
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'project_member_add' }, dto)
    );
  }

  async remove(id: string): Promise<void> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'project_member_remove' }, id)
    );
  }
}
