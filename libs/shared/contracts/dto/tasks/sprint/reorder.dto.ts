import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SprintReorderDto {
  /** Sprint id; the gateway takes it from the route. */
  @IsUUID()
  sprint_id!: string;

  @ApiProperty({ type: [String], description: 'Task ids in their new order' })
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  task_ids!: string[];
}

/** Request body of POST /sprints/:id/reorder. */
export class SprintReorderBodyDto extends OmitType(SprintReorderDto, [
  'sprint_id',
] as const) {}

export class BacklogReorderDto {
  /** Project id; the gateway takes it from the route. */
  @IsUUID()
  project_id!: string;

  @ApiProperty({ type: [String], description: 'Task ids in their new order' })
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  task_ids!: string[];
}

/** Request body of POST /sprints/project/:projectId/backlog/reorder. */
export class BacklogReorderBodyDto extends OmitType(BacklogReorderDto, [
  'project_id',
] as const) {}
