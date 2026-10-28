import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { TaskStatus } from '../../../enums';

export class TaskMoveDto {
  @ApiProperty()
  @IsUUID()
  task_id!: string;

  @ApiProperty()
  @IsUUID()
  board_id!: string;

  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}

/** Request body of POST /tasks/:id/move (the task comes from the route). */
export class TaskMoveBodyDto extends OmitType(TaskMoveDto, ['task_id'] as const) {}
