import { Module } from '@nestjs/common';
import {
  TaskModule,
  TaskCommentModule,
  TaskDependenciesModule,
  ProjectModule,
  ProjectMemberModule,
  BoardModule,
  SprintModule,
  LabelModule,
  AccessModule,
} from './modules';

@Module({
  imports: [
    TaskModule,
    TaskCommentModule,
    TaskDependenciesModule,
    ProjectModule,
    ProjectMemberModule,
    BoardModule,
    SprintModule,
    LabelModule,
    AccessModule,
  ],
})
export class TasksModule {}
