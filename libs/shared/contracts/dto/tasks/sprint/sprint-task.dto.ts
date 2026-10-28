import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddTaskToSprintDto {
  /** Sprint id; the gateway takes it from the route. */
  @IsUUID()
  sprint_id!: string;

  @ApiProperty()
  @IsUUID()
  task_id!: string;
}

/** Request body of POST /sprints/:id/tasks. */
export class AddTaskToSprintBodyDto extends OmitType(AddTaskToSprintDto, [
  'sprint_id',
] as const) {}

export class RemoveTaskFromSprintDto {
  @IsUUID()
  sprint_id!: string;

  @IsUUID()
  task_id!: string;
}
