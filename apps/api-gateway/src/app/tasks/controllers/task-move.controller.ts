import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BoardService } from '../services/board.service';
import { TaskMoveDto } from '@shared/contracts';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { ProjectRoles } from '../../common/guards/project-roles.decorator';
import { ProjectScope } from '../../common/guards/project-scope.decorator';
import { ProjectRole } from '@shared/contracts';

@ApiTags('Tasks')
@UseGuards(JwtAuthGuard, ProjectRolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'tasks', version: '1' })
export class TaskMoveController {
  constructor(private readonly service: BoardService) {}

  @Post(':id/move')
  @ApiOperation({ summary: 'Move task to a new column (status) in a board', operationId: 'moveTask' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'task', in: 'param', key: 'id', also: [{ resource: 'board', in: 'body', key: 'board_id' }] })
  move(@Param('id') id: string, @Body() body: Omit<TaskMoveDto, 'task_id'>) {
    return this.service.moveTask({ task_id: id, ...body });
  }
}
