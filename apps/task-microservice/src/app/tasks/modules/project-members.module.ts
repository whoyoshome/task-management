import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectMembers } from '../entities/';
import { ProjectMembersController } from '../controllers/project-members.controller';
import { ProjectMembersService } from '../services/project-members.service';
import { ProjectMembersRepository } from '../repositories/project-members.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectMembers])],
  controllers: [ProjectMembersController],
  providers: [ProjectMembersService, ProjectMembersRepository],
  exports: [ProjectMembersRepository],
})
export class ProjectMemberModule {}
