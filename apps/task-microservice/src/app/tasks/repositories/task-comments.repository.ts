import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskComments } from '../entities';

@Injectable()
export class TaskCommentsRepository {
  constructor(
    @InjectRepository(TaskComments)
    private readonly repo: Repository<TaskComments>
  ) {}

  async create(data: Partial<TaskComments>): Promise<TaskComments> {
    const comment = this.repo.create(data);
    return this.repo.save(comment);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
