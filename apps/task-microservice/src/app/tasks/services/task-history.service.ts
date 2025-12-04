import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskHistoryRepository } from '../repositories/task-history.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities';

@Injectable()
export class TaskHistoryService {
  constructor(
    private readonly repo: TaskHistoryRepository,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>
  ) {}

  async list(task_id: string) {
    const task = await this.taskRepo.findOne({ where: { id: task_id } });
    if (!task) throw new NotFoundException('Task not found');
    return this.repo.listByTask(task_id);
  }
}
