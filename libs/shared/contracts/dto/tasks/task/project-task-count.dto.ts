import { ApiProperty } from '@nestjs/swagger';

/** Task totals for one project, as returned by GET /tasks/counts. */
export class ProjectTaskCountDto {
  @ApiProperty()
  project_id!: string;

  @ApiProperty({ description: 'All tasks in the project' })
  total!: number;

  @ApiProperty({ description: 'Tasks in the project assigned to the caller' })
  assigned_to_me!: number;
}
