import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateTaskDto, TaskFilterDto, UpdateTaskDto } from '@shared/contracts';
import { TaskService } from '../services/task.service';

@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @MessagePattern({ cmd: 'task_create' })
  create(@Payload() dto: CreateTaskDto) {
    return this.taskService.create(dto);
  }

  @MessagePattern({ cmd: 'task_update' })
  update(@Payload() { id, data }: { id: string; data: UpdateTaskDto }) {
    return this.taskService.update(id, data);
  }

  @MessagePattern({ cmd: 'task_find_all' })
  findAll() {
    return this.taskService.findAll();
  }

  @MessagePattern({ cmd: 'task_find_filtered' })
  findFiltered(@Payload() dto: TaskFilterDto) {
    return this.taskService.findFiltered(dto);
  }

  @MessagePattern({ cmd: 'task_find_one' })
  findOne(@Payload() id: string) {
    return this.taskService.findOne(id);
  }

  @MessagePattern({ cmd: 'task_delete' })
  remove(@Payload() id: string) {
    return this.taskService.remove(id);
  }

  @MessagePattern({ cmd: 'task_find_one_with_details' })
  findOneWithDetails(@Payload() id: string) {
    return this.taskService.findOneWithDetails(id);
  }
}
