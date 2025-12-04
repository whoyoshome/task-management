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
  ApiSecurity,
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
import { ProjectRole } from '@shared/contracts';

@ApiTags('Projects')
@ApiSecurity('x-api-key')
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
  create(@Body() dto: CreateProjectDto): Promise<ProjectResponseDto> {
    return this.projectService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects', operationId: 'findAllProjects' })
  @ApiResponse({ status: 200, type: ProjectResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(): Promise<ProjectResponseDto[]> {
    return this.projectService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID', operationId: 'findOneProject' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @UseGuards(ProjectRolesGuard)
  @ProjectRoles(ProjectRole.VIEWER, ProjectRole.MEMBER, ProjectRole.ADMIN)
  findOne(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ProjectRolesGuard)
  @ProjectRoles(ProjectRole.ADMIN)
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
  findOneWithMembers(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectService.findOneWithMembers(id);
  }
}
