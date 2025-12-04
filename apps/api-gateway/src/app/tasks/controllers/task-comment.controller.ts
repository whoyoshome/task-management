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
import { TaskCommentService } from '../services/task-comment.service';
import {
  CreateTaskCommentDto,
  TaskCommentResponseDto,
} from '@shared/contracts';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { ProjectRoles } from '../../common/guards/project-roles.decorator';
import { ProjectRole } from '@shared/contracts';

@ApiTags('Task Comments')
@ApiSecurity('x-api-key')
@UseGuards(JwtAuthGuard, ProjectRolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'task-comments', version: '1' })
export class TaskCommentController {
  constructor(private readonly commentService: TaskCommentService) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment to a task', operationId: 'createTaskComment' })
  @ApiResponse({ status: 201, type: TaskCommentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  create(@Body() dto: CreateTaskCommentDto): Promise<TaskCommentResponseDto> {
    return this.commentService.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete comment by ID', operationId: 'deleteTaskComment' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ProjectRoles(ProjectRole.MEMBER, ProjectRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.commentService.remove(id);
  }
}
