import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectService } from '../services/project.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectResponseDto,
} from '@shared/contracts';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { ProjectRoles } from '../../common/guards/project-roles.decorator';
import { ProjectScope } from '../../common/guards/project-scope.decorator';
import { ProjectRole, UserRole } from '@shared/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('Projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'projects', version: '1' })
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project', operationId: 'createProject' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: JwtPayload
  ): Promise<ProjectResponseDto> {
    return this.projectService.create({ ...dto, created_by: user.sub });
  }

  @Get()
  @ApiOperation({
    summary:
      'Projects the current user is a member of (all projects for global admins)',
    operationId: 'findAllProjects',
  })
  @ApiResponse({ status: 200, type: ProjectResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: JwtPayload): Promise<ProjectResponseDto[]> {
    return this.projectService.findAll(user.sub, user.role === UserRole.ADMIN);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID', operationId: 'findOneProject' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @UseGuards(ProjectRolesGuard)
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'project', in: 'param', key: 'id' })
  findOne(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ProjectRolesGuard)
  @ProjectRoles(ProjectRole.ADMIN)
  @ProjectScope({ resource: 'project', in: 'param', key: 'id' })
  @ApiOperation({ summary: 'Update project by ID', operationId: 'updateProject' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto
  ): Promise<ProjectResponseDto> {
    return this.projectService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(ProjectRolesGuard)
  @ProjectRoles(ProjectRole.ADMIN)
  @ProjectScope({ resource: 'project', in: 'param', key: 'id' })
  @ApiOperation({ summary: 'Delete project by ID', operationId: 'removeProject' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.projectService.remove(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get project with its members', operationId: 'findOneWithMembersProject' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @UseGuards(ProjectRolesGuard)
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  @ProjectScope({ resource: 'project', in: 'param', key: 'id' })
  findOneWithMembers(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectService.findOneWithMembers(id);
  }
}
