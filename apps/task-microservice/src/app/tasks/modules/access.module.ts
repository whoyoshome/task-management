import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task, Project, Board, BoardColumn, Sprint } from '../entities';
import { AccessController } from '../controllers/access.controller';
import { AccessService } from '../services/access.service';
import { Label } from '../entities/labels.entity';
import { TaskLabel } from '../entities/task-labels.entity';
import { LabelRepository } from '../repositories/label.repository';
import { BoardRepository } from '../repositories/board.repository';
import { ProjectMembers } from '../entities/project-members.entity';
import { ProjectMembersRepository } from '../repositories/project-members.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      Project,
      Board,
      BoardColumn,
      Sprint,
      Label,
      TaskLabel,
      ProjectMembers,
    ]),
  ],
  controllers: [AccessController],
  providers: [AccessService, LabelRepository, BoardRepository, ProjectMembersRepository],
})
export class AccessModule {}
