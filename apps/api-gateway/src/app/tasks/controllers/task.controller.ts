import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TaskService } from '../services/task.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskHistoryResponseDto,
  TaskFilterDto,
  TaskListResponseDto,
  TaskDetailsResponseDto,
  MyTasksQueryDto,
  ProjectTaskCountDto,
  UserRole,
} from '@shared/contracts';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { ProjectRoles } from '../../common/guards/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { ProjectRole } from '@shared/contracts';
import { TaskModifyGuard } from '../../common/guards/task-modify.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('Tasks')
@UseGuards(JwtAuthGuard, ProjectRolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'tasks', version: '1' })
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task', operationId: 'createTask' })
  @ApiResponse({ status: 201, type: TaskResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admins only' })
  @ProjectRoles(ProjectRole.ADMIN, ProjectRole.MEMBER)
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: JwtPayload
  ): Promise<TaskResponseDto> {
    return this.taskService.create({ ...dto, created_by: user.sub });
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks', operationId: 'findAllTasks' })
  @ApiResponse({ status: 200, type: TaskResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  findAll(): Promise<TaskResponseDto[]> {
    return this.taskService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search tasks with filters', operationId: 'searchTasks' })
  @ApiResponse({ status: 200, type: TaskListResponseDto })
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  search(@Query() query: TaskFilterDto): Promise<TaskListResponseDto> {
    return this.taskService.findFiltered(query);
  }

  // Not project-scoped (no @ProjectRoles): results are limited to the caller.
  @Get('mine')
  @ApiOperation({
    summary: 'Tasks assigned to the current user across all projects',
    operationId: 'findMyTasks',
  })
  @ApiResponse({ status: 200, type: TaskListResponseDto })
  findMine(
    @Query() query: MyTasksQueryDto,
    @CurrentUser() user: JwtPayload
  ): Promise<TaskListResponseDto> {
    return this.taskService.findAssignedTo(user.sub, query);
  }

  @Get('counts')
  @ApiOperation({
    summary:
      'Task totals per project for the projects the current user belongs to (all projects for admins)',
    operationId: 'countTasksByProject',
  })
  @ApiResponse({ status: 200, type: ProjectTaskCountDto, isArray: true })
  countByProject(
    @CurrentUser() user: JwtPayload
  ): Promise<ProjectTaskCountDto[]> {
    return this.taskService.countByProject(
      user.sub,
      user.role === UserRole.ADMIN
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID', operationId: 'findOneTask' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  findOne(@Param('id') id: string): Promise<TaskResponseDto> {
    return this.taskService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(TaskModifyGuard)
  @ApiOperation({ summary: 'Update task by ID', operationId: 'updateTask' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admins only' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload
  ): Promise<TaskResponseDto> {
    return this.taskService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @UseGuards(TaskModifyGuard)
  @ApiOperation({ summary: 'Delete task by ID', operationId: 'removeTask' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admins only' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.taskService.remove(id);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get task with project and user details', operationId: 'findOneWithDetailsTask' })
  @ApiResponse({ status: 200, type: TaskDetailsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  findOneWithDetails(@Param('id') id: string): Promise<TaskDetailsResponseDto> {
    return this.taskService.findOneWithDetails(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get task history', operationId: 'historyTask' })
  @ApiResponse({ status: 200, description: 'Task history entries', type: TaskHistoryResponseDto, isArray: true })
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  history(@Param('id') id: string): Promise<TaskHistoryResponseDto[]> {
    return this.taskService.getHistory(id);
  }
}
