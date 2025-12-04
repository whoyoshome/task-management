import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { TaskTcpClient } from '@shared/clients';
import { AddTaskToSprintDto, BacklogReorderDto, CloseSprintDto, CreateSprintDto, RemoveTaskFromSprintDto, SprintReorderDto, SprintResponseDto, StartSprintDto } from '@shared/contracts';

@Injectable()
export class SprintService {
  constructor(private readonly client: TaskTcpClient) {}

  create(dto: CreateSprintDto): Promise<SprintResponseDto> {
    return firstValueFrom(this.client.getClient().send({ cmd: 'sprint_create' }, dto));
  }

  get(id: string): Promise<SprintResponseDto> {
    return firstValueFrom(this.client.getClient().send({ cmd: 'sprint_get' }, id));
  }

  listByProject(project_id: string) {
    return firstValueFrom(this.client.getClient().send({ cmd: 'sprint_list_by_project' }, project_id));
  }

  start(dto: StartSprintDto) {
    return firstValueFrom(this.client.getClient().send({ cmd: 'sprint_start' }, dto));
  }

  close(dto: CloseSprintDto) {
    return firstValueFrom(this.client.getClient().send({ cmd: 'sprint_close' }, dto));
  }

  addTask(dto: AddTaskToSprintDto) {
    return firstValueFrom(this.client.getClient().send({ cmd: 'sprint_task_add' }, dto));
  }

  removeTask(dto: RemoveTaskFromSprintDto) {
    return firstValueFrom(this.client.getClient().send({ cmd: 'sprint_task_remove' }, dto));
  }

  reorderSprint(dto: SprintReorderDto) {
    return firstValueFrom(this.client.getClient().send({ cmd: 'sprint_reorder' }, dto));
  }

  reorderBacklog(dto: BacklogReorderDto) {
    return firstValueFrom(this.client.getClient().send({ cmd: 'backlog_reorder' }, dto));
  }
}
