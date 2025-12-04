import { Injectable } from '@nestjs/common';
import { TaskCommentsRepository } from '../repositories/task-comments.repository';
import { CreateTaskCommentDto } from '@shared/contracts';
import { TaskComments } from '../entities';

@Injectable()
export class TaskCommentsService {
  constructor(private readonly commentsRepository: TaskCommentsRepository) {}

  async create(dto: CreateTaskCommentDto): Promise<TaskComments> {
    return this.commentsRepository.create(dto);
  }

  async remove(id: string): Promise<void> {
    await this.commentsRepository.deleteById(id);
  }
}
