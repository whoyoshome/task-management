import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../entities/';
import { ProjectMembers } from '../entities/project-members.entity';
import { ProjectController } from '../controllers/project.controller';
import { ProjectService } from '../services/project.service';
import { ProjectRepository } from '../repositories/project.repository';
import { ProjectMembersRepository } from '../repositories/project-members.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMembers])],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRepository, ProjectMembersRepository],
})
export class ProjectModule {}
