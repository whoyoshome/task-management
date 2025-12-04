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
  ApiSecurity,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectMemberService } from '../services/project-member.service';
import {
  CreateProjectMemberDto,
  ProjectMemberResponseDto,
} from '@shared/contracts';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { ProjectRoles } from '../../common/guards/project-roles.decorator';
import { ProjectRole } from '@shared/contracts';

@ApiTags('Project Members')
@ApiSecurity('x-api-key')
@UseGuards(JwtAuthGuard, ProjectRolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'project-members', version: '1' })
export class ProjectMemberController {
  constructor(private readonly memberService: ProjectMemberService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ProjectRoles(ProjectRole.ADMIN)
  @ApiOperation({ summary: 'Add a member to a project', operationId: 'addMemberToProject' })
  @ApiResponse({ status: 201, type: ProjectMemberResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  add(@Body() dto: CreateProjectMemberDto): Promise<ProjectMemberResponseDto> {
    return this.memberService.add(dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ProjectRoles(ProjectRole.ADMIN)
  @ApiOperation({ summary: 'Remove a member from a project', operationId: 'removeMemberFromProject' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project member not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.memberService.remove(id);
  }
}
