import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskResponseDto } from './task-response.dto';
import { TaskCommentResponseDto } from '../task-comment/task-comment-response.dto';
import { ProjectResponseDto } from '../project/project-response.dto';

export class TaskDetailsResponseDto extends TaskResponseDto {
  @ApiPropertyOptional({ type: ProjectResponseDto })
  project?: ProjectResponseDto;

  @ApiProperty({ type: TaskCommentResponseDto, isArray: true })
  comments!: TaskCommentResponseDto[];
}
