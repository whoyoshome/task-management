import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project, Sprint, Task } from '../entities';
import { SprintRepository } from '../repositories/sprint.repository';
import { SprintService } from '../services/sprint.service';
import { SprintController } from '../controllers/sprint.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, Task, Project])],
  controllers: [SprintController],
  providers: [SprintRepository, SprintService],
})
export class SprintModule {}
