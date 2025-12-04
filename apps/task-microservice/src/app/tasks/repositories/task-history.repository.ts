import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskHistory } from '../entities';

@Injectable()
export class TaskHistoryRepository {
  constructor(
    @InjectRepository(TaskHistory) private readonly repo: Repository<TaskHistory>
  ) {}

  listByTask(task_id: string) {
    return this.repo.find({ where: { task_id }, order: { created_at: 'DESC' } });
  }
}
