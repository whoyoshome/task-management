import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskDependencies } from '../entities/task-dependencies.entity';

@Injectable()
export class TaskDependenciesRepository {
  constructor(
    @InjectRepository(TaskDependencies)
    private readonly repo: Repository<TaskDependencies>
  ) {}

  async create(data: Partial<TaskDependencies>): Promise<TaskDependencies> {
    const dep = this.repo.create(data);
    return this.repo.save(dep);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
