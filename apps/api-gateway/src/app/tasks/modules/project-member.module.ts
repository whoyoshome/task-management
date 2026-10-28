import { Module } from '@nestjs/common';
import { ProjectMemberController } from '../controllers/project-member.controller';
import { ProjectMemberService } from '../services/project-member.service';
import {
  RemoteUserValidatorService,
  RemoteProjectValidatorService,
  RemoteAccessService,
} from '@libs/utils';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  controllers: [ProjectMemberController],
  providers: [
    ProjectMemberService,
    RemoteUserValidatorService,
    RemoteProjectValidatorService,
    RemoteAccessService,
    ProjectRolesGuard,
  ],
})
export class ProjectMemberModule {}
