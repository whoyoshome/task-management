import { Module } from '@nestjs/common';
import { TaskCommentController } from '../controllers/task-comment.controller';
import { TaskCommentService } from '../services/task-comment.service';
import { TaskTcpClient, UserTcpClient } from '@shared/clients';
import {
  RemoteUserValidatorService,
  RemoteTaskValidatorService,
  RemoteAccessService,
} from '@libs/utils';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  controllers: [TaskCommentController],
  providers: [
    TaskCommentService,
    TaskTcpClient,
    UserTcpClient,
    RemoteUserValidatorService,
    RemoteTaskValidatorService,
    RemoteAccessService,
    ProjectRolesGuard,
  ],
})
export class TaskCommentModule {}
