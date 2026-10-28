import { Controller, Post, Patch, Delete, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssignLabelDto, CreateLabelDto, LabelResponseDto, RemoveLabelDto, UpdateLabelBodyDto, UpdateLabelDto } from '@shared/contracts';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { ProjectRoles } from '../../common/guards/project-roles.decorator';
import { ProjectScope } from '../../common/guards/project-scope.decorator';
import { ProjectRole } from '@shared/contracts';
import { LabelService } from '../services/label.service';

@ApiTags('Labels')
@UseGuards(JwtAuthGuard, ProjectRolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'labels', version: '1' })
export class LabelController {
  constructor(private readonly service: LabelService) {}

  @Post()
  @ApiOperation({ summary: 'Create a label', operationId: 'createLabel' })
  @ApiResponse({ status: 201, type: LabelResponseDto })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'project', in: 'body', key: 'project_id' })
  create(@Body() dto: CreateLabelDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a label', operationId: 'updateLabel' })
  @ApiResponse({ status: 200, type: LabelResponseDto })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'label', in: 'param', key: 'id' })
  update(@Param('id') id: string, @Body() body: UpdateLabelBodyDto) {
    const dto: UpdateLabelDto = { label_id: id, ...body };
    return this.service.update(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a label', operationId: 'deleteLabel' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'label', in: 'param', key: 'id' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Get('/projects/:projectId')
  @ApiOperation({ summary: 'List labels by project', operationId: 'listLabelsByProject' })
  @ApiResponse({ status: 200, type: LabelResponseDto, isArray: true })
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'project', in: 'param', key: 'projectId' })
  list(@Param('projectId') projectId: string) {
    return this.service.listByProject(projectId);
  }

  @Get('/tasks/:taskId')
  @ApiOperation({ summary: 'List labels assigned to a task', operationId: 'listLabelsByTask' })
  @ApiResponse({ status: 200, type: LabelResponseDto, isArray: true })
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'task', in: 'param', key: 'taskId' })
  listByTask(@Param('taskId') taskId: string) {
    return this.service.listByTask(taskId);
  }

  @Post('/tasks/:taskId/:labelId')
  @ApiOperation({ summary: 'Assign a label to a task', operationId: 'assignLabelToTask' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'task', in: 'param', key: 'taskId', also: [{ resource: 'label', in: 'param', key: 'labelId' }] })
  assign(@Param('taskId') taskId: string, @Param('labelId') labelId: string) {
    const dto: AssignLabelDto = { task_id: taskId, label_id: labelId };
    return this.service.assign(dto);
  }

  @Delete('/tasks/:taskId/:labelId')
  @ApiOperation({ summary: 'Remove a label from a task', operationId: 'removeLabelFromTask' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'task', in: 'param', key: 'taskId', also: [{ resource: 'label', in: 'param', key: 'labelId' }] })
  remove(@Param('taskId') taskId: string, @Param('labelId') labelId: string) {
    const dto: RemoveLabelDto = { task_id: taskId, label_id: labelId };
    return this.service.remove(dto);
  }
}
