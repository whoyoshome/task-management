import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskDependencies } from '../entities/';
import { TaskDependenciesController } from '../controllers/task-dependencies.controller';
import { TaskDependenciesService } from '../services/task-dependencies.service';
import { TaskDependenciesRepository } from '../repositories/task-dependencies.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TaskDependencies])],
  controllers: [TaskDependenciesController],
  providers: [TaskDependenciesService, TaskDependenciesRepository],
})
export class TaskDependenciesModule {}
