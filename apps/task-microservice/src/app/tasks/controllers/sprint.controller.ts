import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SprintService } from '../services/sprint.service';
import { AddTaskToSprintDto, CloseSprintDto, CreateSprintDto, RemoveTaskFromSprintDto, StartSprintDto, SprintReorderDto, BacklogReorderDto } from '@shared/contracts';

@Controller()
export class SprintController {
  constructor(private readonly service: SprintService) {}

  @MessagePattern({ cmd: 'sprint_create' })
  create(@Payload() dto: CreateSprintDto) {
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'sprint_get' })
  get(@Payload() id: string) {
    return this.service.get(id);
  }

  @MessagePattern({ cmd: 'sprint_list_by_project' })
  listByProject(@Payload() project_id: string) {
    return this.service.listByProject(project_id);
  }

  @MessagePattern({ cmd: 'sprint_start' })
  start(@Payload() dto: StartSprintDto) {
    return this.service.start(dto);
  }

  @MessagePattern({ cmd: 'sprint_close' })
  close(@Payload() dto: CloseSprintDto) {
    return this.service.close(dto);
  }

  @MessagePattern({ cmd: 'sprint_task_add' })
  addTask(@Payload() dto: AddTaskToSprintDto) {
    return this.service.addTask(dto);
  }

  @MessagePattern({ cmd: 'sprint_task_remove' })
  removeTask(@Payload() dto: RemoveTaskFromSprintDto) {
    return this.service.removeTask(dto);
  }

  @MessagePattern({ cmd: 'sprint_reorder' })
  reorder(@Payload() dto: SprintReorderDto) {
    return this.service.reorderSprint(dto);
  }

  @MessagePattern({ cmd: 'backlog_reorder' })
  reorderBacklog(@Payload() dto: BacklogReorderDto) {
    return this.service.reorderBacklog(dto);
  }
}
