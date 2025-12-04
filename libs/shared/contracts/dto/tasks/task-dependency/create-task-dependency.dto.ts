import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDependencyDto {
  @ApiProperty({ example: 'uuid-task' })
  @IsUUID()
  task_id: string;

  @ApiProperty({ example: 'uuid-of-dependency' })
  @IsUUID()
  dependency_on_task_id: string;
}
