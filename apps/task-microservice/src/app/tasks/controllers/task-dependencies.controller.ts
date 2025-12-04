import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateTaskDependencyDto } from '@shared/contracts';
import { TaskDependenciesService } from '../services/task-dependencies.service';

@Controller()
export class TaskDependenciesController {
  constructor(
    private readonly taskDependenciesService: TaskDependenciesService
  ) {}

  @MessagePattern({ cmd: 'dependency_create' })
  create(@Payload() dto: CreateTaskDependencyDto) {
    return this.taskDependenciesService.create(dto);
  }

  @MessagePattern({ cmd: 'dependency_delete' })
  remove(@Payload() id: string) {
    return this.taskDependenciesService.remove(id);
  }
}
