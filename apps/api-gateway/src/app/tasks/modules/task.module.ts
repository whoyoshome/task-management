import { Module } from '@nestjs/common';
import { TaskController } from '../controllers/task.controller';
import { TaskService } from '../services/task.service';
import { TaskTcpClient, UserTcpClient } from '@shared/clients';
import {
  RemoteUserValidatorService,
  RemoteProjectValidatorService,
  RemoteAccessService,
} from '@libs/utils';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { TaskModifyGuard } from '../../common/guards/task-modify.guard';

@Module({
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskTcpClient,
    UserTcpClient,
    RemoteUserValidatorService,
    RemoteProjectValidatorService,
    RemoteAccessService,
    ProjectRolesGuard,
    TaskModifyGuard,
  ],
})
export class TaskModule {}
