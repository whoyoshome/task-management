import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskCommentDto {
  @ApiProperty({ example: 'uuid-of-task' })
  @IsUUID()
  task_id: string;

  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ example: 'This task needs attention' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
