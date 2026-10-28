import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BoardService } from '../services/board.service';
import { BoardResponseDto, CreateBoardColumnDto, CreateBoardDto, TaskMoveDto, UpdateBoardColumnDto } from '@shared/contracts';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { ProjectRoles } from '../../common/guards/project-roles.decorator';
import { ProjectScope } from '../../common/guards/project-scope.decorator';
import { ProjectRole } from '@shared/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('Boards')
@UseGuards(JwtAuthGuard, ProjectRolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'boards', version: '1' })
export class BoardController {
  constructor(private readonly service: BoardService) {}

  @Post()
  @ApiOperation({ summary: 'Create a board for a project', operationId: 'createBoard' })
  @ApiResponse({ status: 201, type: BoardResponseDto })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'project', in: 'body', key: 'project_id' })
  create(@Body() dto: CreateBoardDto): Promise<BoardResponseDto> {
    return this.service.createBoard(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get board with columns', operationId: 'getBoard' })
  @ApiResponse({ status: 200, type: BoardResponseDto })
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'board', in: 'param', key: 'id' })
  get(@Param('id') id: string): Promise<BoardResponseDto> {
    return this.service.getBoardWithColumns(id);
  }

  @Post('columns')
  @ApiOperation({ summary: 'Create a board column', operationId: 'createColumn' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'board', in: 'body', key: 'board_id' })
  createColumn(@Body() dto: CreateBoardColumnDto) {
    return this.service.createColumn(dto);
  }

  @Patch('columns/:id')
  @ApiOperation({ summary: 'Update a board column', operationId: 'updateColumn' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'board_column', in: 'param', key: 'id' })
  updateColumn(@Param('id') id: string, @Body() dto: UpdateBoardColumnDto) {
    return this.service.updateColumn({ id, ...dto });
  }

  @Delete('columns/:id')
  @ApiOperation({ summary: 'Delete a board column', operationId: 'deleteColumn' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'board_column', in: 'param', key: 'id' })
  deleteColumn(@Param('id') id: string) {
    return this.service.deleteColumn(id);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get or create default board for a project', operationId: 'getDefaultBoard' })
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'project', in: 'param', key: 'projectId' })
  getDefaultBoard(@Param('projectId') projectId: string) {
    return this.service.getDefaultBoardForProject(projectId);
  }

  @Post('move')
  @ApiOperation({ summary: 'Move a task to a new status within a board', operationId: 'moveTaskOnBoard' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'task', in: 'body', key: 'task_id', also: [{ resource: 'board', in: 'body', key: 'board_id' }] })
  moveTask(@Body() dto: TaskMoveDto, @CurrentUser() user: JwtPayload) {
    return this.service.moveTask(dto, user.sub);
  }
}
