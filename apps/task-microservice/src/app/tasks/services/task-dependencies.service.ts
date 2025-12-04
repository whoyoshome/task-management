import { Injectable } from '@nestjs/common';
import { TaskDependenciesRepository } from '../repositories/task-dependencies.repository';
import { CreateTaskDependencyDto } from '@shared/contracts';
import { TaskDependencies } from '../entities';

@Injectable()
export class TaskDependenciesService {
  constructor(private readonly repository: TaskDependenciesRepository) {}

  async create(dto: CreateTaskDependencyDto): Promise<TaskDependencies> {
    return this.repository.create(dto);
  }

  async remove(id: string): Promise<void> {
    await this.repository.deleteById(id);
  }
}
