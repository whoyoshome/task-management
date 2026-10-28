import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TaskDependencyService } from '../services/task-dependency.service';
import {
  CreateTaskDependencyDto,
  TaskDependencyResponseDto,
} from '@shared/contracts';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { ProjectRoles } from '../../common/guards/project-roles.decorator';
import { ProjectScope } from '../../common/guards/project-scope.decorator';
import { ProjectRole } from '@shared/contracts';

@ApiTags('Task Dependencies')
@UseGuards(JwtAuthGuard, ProjectRolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'task-dependencies', version: '1' })
export class TaskDependencyController {
  constructor(private readonly dependencyService: TaskDependencyService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a task dependency', operationId: 'createTaskDependency' })
  @ApiResponse({ status: 201, type: TaskDependencyResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admins only' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'task', in: 'body', key: 'task_id', also: [{ resource: 'task', in: 'body', key: 'dependency_on_task_id' }] })
  create(
    @Body() dto: CreateTaskDependencyDto
  ): Promise<TaskDependencyResponseDto> {
    return this.dependencyService.create(dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a task dependency', operationId: 'deleteTaskDependency' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admins only' })
  @ApiResponse({ status: 404, description: 'Task dependency not found' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'task_dependency', in: 'param', key: 'id' })
  remove(@Param('id') id: string): Promise<void> {
    return this.dependencyService.remove(id);
  }
}
