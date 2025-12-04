import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskComments } from '../entities/';
import { TaskCommentsController } from '../controllers/task-comments.controller';
import { TaskCommentsService } from '../services/task-comments.service';
import { TaskCommentsRepository } from '../repositories/task-comments.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TaskComments])],
  controllers: [TaskCommentsController],
  providers: [TaskCommentsService, TaskCommentsRepository],
})
export class TaskCommentModule {}
