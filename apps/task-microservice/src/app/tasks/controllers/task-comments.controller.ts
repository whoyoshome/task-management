import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateTaskCommentDto } from '@shared/contracts';
import { TaskCommentsService } from '../services/task-comments.service';

@Controller()
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  @MessagePattern({ cmd: 'comment_create' })
  create(@Payload() dto: CreateTaskCommentDto) {
    return this.taskCommentsService.create(dto);
  }

  @MessagePattern({ cmd: 'comment_delete' })
  remove(@Payload() id: string) {
    return this.taskCommentsService.remove(id);
  }
}
