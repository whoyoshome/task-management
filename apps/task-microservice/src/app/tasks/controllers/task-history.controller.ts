import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskHistoryService } from '../services/task-history.service';

@Controller()
export class TaskHistoryController {
  constructor(private readonly service: TaskHistoryService) {}

  @MessagePattern({ cmd: 'task_history_list' })
  list(@Payload() task_id: string) {
    return this.service.list(task_id);
  }
}
