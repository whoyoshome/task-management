import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AssignLabelDto, CreateLabelDto, LabelResponseDto, RemoveLabelDto, UpdateLabelDto } from '@shared/contracts';
import { TaskTcpClient } from '@shared/clients';
import { RemoteProjectValidatorService } from '@libs/utils';

@Injectable()
export class LabelService {
  constructor(
    private readonly taskTcpClient: TaskTcpClient,
    private readonly projectValidator: RemoteProjectValidatorService
  ) {}

  async create(dto: CreateLabelDto): Promise<LabelResponseDto> {
    await this.projectValidator.validateProjectExists(dto.project_id);
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'label_create' }, dto)
    );
  }

  async update(dto: UpdateLabelDto): Promise<LabelResponseDto> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'label_update' }, dto)
    );
  }

  async delete(id: string): Promise<{ ok: boolean }> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'label_delete' }, id)
    );
  }

  async listByProject(project_id: string): Promise<LabelResponseDto[]> {
    await this.projectValidator.validateProjectExists(project_id);
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'label_list_by_project' }, project_id)
    );
  }

  async assign(dto: AssignLabelDto): Promise<{ ok: boolean }> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'label_assign_to_task' }, dto)
    );
  }

  async remove(dto: RemoveLabelDto): Promise<{ ok: boolean }> {
    return firstValueFrom(
      this.taskTcpClient.getClient().send({ cmd: 'label_remove_from_task' }, dto)
    );
  }
}
