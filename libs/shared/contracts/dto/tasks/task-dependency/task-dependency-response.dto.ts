import { ApiProperty } from '@nestjs/swagger';

export class TaskDependencyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  task_id: string;

  @ApiProperty()
  dependency_on_task_id: string;

  @ApiProperty()
  created_at: Date;
}
