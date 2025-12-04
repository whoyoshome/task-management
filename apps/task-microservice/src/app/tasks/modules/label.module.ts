import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label, Project, Task, TaskLabel } from '../entities';
import { LabelRepository } from '../repositories/label.repository';
import { LabelService } from '../services/label.service';
import { LabelController } from '../controllers/label.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Label, TaskLabel, Task, Project])],
  controllers: [LabelController],
  providers: [LabelRepository, LabelService],
  exports: [LabelRepository],
})
export class LabelModule {}
