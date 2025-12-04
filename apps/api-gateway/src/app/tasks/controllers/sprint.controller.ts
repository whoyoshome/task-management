import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SprintService } from '../services/sprint.service';
import { AddTaskToSprintDto, BacklogReorderDto, CloseSprintDto, CreateSprintDto, SprintReorderDto, SprintResponseDto, StartSprintDto } from '@shared/contracts';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { ProjectRoles } from '../../common/guards/project-roles.decorator';
import { ProjectRole } from '@shared/contracts';

@ApiTags('Sprints')
@ApiSecurity('x-api-key')
@UseGuards(JwtAuthGuard, ProjectRolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'sprints', version: '1' })
export class SprintController {
  constructor(private readonly service: SprintService) {}

  @Post()
  @ApiOperation({ summary: 'Create a sprint', operationId: 'createSprint' })
  @ApiResponse({ status: 201, type: SprintResponseDto })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  create(@Body() dto: CreateSprintDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sprint by id', operationId: 'getSprintById' })
  @ApiResponse({ status: 200, type: SprintResponseDto })
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Get('/project/:projectId')
  @ApiOperation({ summary: 'List sprints by project', operationId: 'listSprintsByProject' })
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  list(@Param('projectId') projectId: string) {
    return this.service.listByProject(projectId);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a sprint', operationId: 'startSprint' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  start(@Param('id') id: string, @Body() body: Omit<StartSprintDto, 'id'>) {
    return this.service.start({ id, ...body });
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close a sprint', operationId: 'closeSprint' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  close(@Param('id') id: string) {
    return this.service.close({ id } as CloseSprintDto);
  }

  @Post(':id/tasks')
  @ApiOperation({ summary: 'Add a task to sprint', operationId: 'addTaskToSprint' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  addTask(@Param('id') id: string, @Body() body: Omit<AddTaskToSprintDto, 'sprint_id'>) {
    return this.service.addTask({ sprint_id: id, ...body });
  }

  @Delete(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Remove a task from sprint', operationId: 'removeTaskFromSprint' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  removeTask(@Param('id') id: string, @Param('taskId') taskId: string) {
    return this.service.removeTask({ sprint_id: id, task_id: taskId });
  }

  @Post(':id/reorder')
  @ApiOperation({ summary: 'Reorder tasks within a sprint', operationId: 'reorderSprint' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  reorderSprint(@Param('id') id: string, @Body() body: Omit<SprintReorderDto, 'sprint_id'>) {
    return this.service.reorderSprint({ sprint_id: id, ...body });
  }

  @Post('/project/:projectId/backlog/reorder')
  @ApiOperation({ summary: 'Reorder backlog tasks (no sprint) for a project', operationId: 'reorderBacklog' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  reorderBacklog(@Param('projectId') projectId: string, @Body() body: Omit<BacklogReorderDto, 'project_id'>) {
    return this.service.reorderBacklog({ project_id: projectId, ...body });
  }
}
