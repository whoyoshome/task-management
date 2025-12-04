import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskPriority, TaskStatus } from '../../../enums';

export class TaskFilterDto {
  @ApiProperty({ description: 'Scope search within a project' })
  @IsUUID()
  project_id!: string;

  @ApiPropertyOptional({ description: 'Free-text search over title and description' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ isArray: true, enum: TaskStatus })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsEnum(TaskStatus, { each: true })
  @IsOptional()
  statuses?: TaskStatus[];

  @ApiPropertyOptional({ isArray: true, enum: TaskPriority })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsEnum(TaskPriority, { each: true })
  @IsOptional()
  priorities?: TaskPriority[];

  @ApiPropertyOptional({ isArray: true, description: 'Filter by assignee user IDs' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  assignee_ids?: string[];

  @ApiPropertyOptional({ isArray: true, description: 'Filter by creator user IDs' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  created_by_ids?: string[];

  @ApiPropertyOptional({ isArray: true, description: 'Filter by label IDs (AND semantics by default)' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  label_ids?: string[];

  @ApiPropertyOptional({ description: 'Filter by specific sprint' })
  @IsUUID()
  @IsOptional()
  sprint_id?: string;

  @ApiPropertyOptional({ description: 'If true, include only backlog (no sprint) tasks' })
  @IsBoolean()
  @IsOptional()
  backlog_only?: boolean;

  @ApiPropertyOptional({ enum: ['created_at', 'priority', 'due_date'] })
  @IsIn(['created_at', 'priority', 'due_date'])
  @IsOptional()
  sort_by?: 'created_at' | 'priority' | 'due_date';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sort_dir?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;
}
