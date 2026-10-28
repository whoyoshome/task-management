import { ApiProperty } from '@nestjs/swagger';

/** One label assigned to one task (GET /labels/projects/:id/assignments). */
export class TaskLabelAssignmentDto {
  @ApiProperty()
  task_id!: string;

  @ApiProperty()
  label_id!: string;
}
