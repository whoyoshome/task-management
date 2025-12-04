import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '../../../enums';

export class CreateTaskDto {
  @ApiProperty({ example: 'Fix login bug' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Resolve issue with token expiration on login' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2025-05-20' })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiProperty({ example: 'uuid-of-creator' })
  @IsUUID()
  created_by: string;

  @ApiProperty({ example: 'uuid-of-assignee' })
  @IsUUID()
  assigned_to: string;

  @ApiProperty({ example: 'uuid-of-project' })
  @IsUUID()
  project_id: string;
}
