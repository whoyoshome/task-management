import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskStatus } from '../../../enums';

/** Which of the caller's tasks GET /tasks/mine returns. */
export enum MyTasksScope {
  ASSIGNED = 'assigned',
  CREATED = 'created',
}

/** Query for GET /tasks/mine: the caller's tasks, across all projects. */
export class MyTasksQueryDto {
  @ApiPropertyOptional({ enum: MyTasksScope, default: MyTasksScope.ASSIGNED })
  @IsEnum(MyTasksScope)
  @IsOptional()
  scope?: MyTasksScope = MyTasksScope.ASSIGNED;

  @ApiPropertyOptional({ isArray: true, enum: TaskStatus })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsEnum(TaskStatus, { each: true })
  @IsOptional()
  statuses?: TaskStatus[];

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  limit?: number = 50;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;
}
