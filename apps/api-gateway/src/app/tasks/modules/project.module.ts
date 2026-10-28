import { Module } from '@nestjs/common';
import { ProjectController } from '../controllers/project.controller';
import { ProjectService } from '../services/project.service';
import { RemoteUserValidatorService, RemoteAccessService } from '@libs/utils';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  controllers: [ProjectController],
  providers: [
    ProjectService,
    RemoteUserValidatorService,
    RemoteAccessService,
    ProjectRolesGuard,
  ],
})
export class ProjectModule {}
