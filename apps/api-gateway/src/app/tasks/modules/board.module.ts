import { Module } from '@nestjs/common';
import { BoardService } from '../services/board.service';
import { BoardController } from '../controllers/board.controller';
import { TaskMoveController } from '../controllers/task-move.controller';
import { SprintService } from '../services/sprint.service';
import { SprintController } from '../controllers/sprint.controller';
import { LabelService } from '../services/label.service';
import { LabelController } from '../controllers/label.controller';
import { TaskTcpClient } from '@shared/clients';
import { RemoteProjectValidatorService, RemoteAccessService } from '@libs/utils';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  controllers: [BoardController, TaskMoveController, SprintController, LabelController],
  providers: [BoardService, SprintService, LabelService, TaskTcpClient, RemoteProjectValidatorService, RemoteAccessService, ProjectRolesGuard],
})
export class BoardModule {}
