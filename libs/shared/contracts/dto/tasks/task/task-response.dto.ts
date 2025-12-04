import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '../../../enums';

export class TaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority })
  priority: TaskPriority;

  @ApiProperty()
  due_date: Date | null;

  @ApiProperty()
  created_by: string;

  @ApiProperty()
  assigned_to: string;

  @ApiProperty()
  project_id: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
