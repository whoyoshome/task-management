import { Module } from '@nestjs/common';
import { TaskDependencyController } from '../controllers/task-dependency.controller';
import { TaskDependencyService } from '../services/task-dependency.service';
import { TaskTcpClient } from '@shared/clients';
import { RemoteAccessService } from '@libs/utils';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  controllers: [TaskDependencyController],
  providers: [TaskDependencyService, TaskTcpClient, RemoteAccessService, ProjectRolesGuard],
})
export class TaskDependenciesModule {}
