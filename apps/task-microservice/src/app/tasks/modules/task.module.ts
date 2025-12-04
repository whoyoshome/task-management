import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task, TaskHistory } from '../entities/';
import { TaskController } from '../controllers/task.controller';
import { TaskService } from '../services/task.service';
import { TaskRepository } from '../repositories/task.repository';
import { TaskHistoryRepository } from '../repositories/task-history.repository';
import { TaskHistoryService } from '../services/task-history.service';
import { TaskHistoryController } from '../controllers/task-history.controller';
import { LabelModule } from './label.module';
import { ProjectMemberModule } from './project-members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskHistory]),
    LabelModule,
    ProjectMemberModule,
  ],
  controllers: [TaskController, TaskHistoryController],
  providers: [
    TaskService,
    TaskRepository,
    TaskHistoryRepository,
    TaskHistoryService,
  ],
})
export class TaskModule {}
